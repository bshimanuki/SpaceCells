#include "resolve.h"

#include <algorithm>
#include <array>
#include <deque>
#include <functional>
#include <iostream>
#include <stack>
#include <string>

namespace puzzle {

template<typename T>
std::ostream& operator<<(std::ostream &os, const std::deque<T*> &st) {
  os << "[";
  for (auto x : st) os << *x << " ";
  return os << "]";
}

enum R_ {
  // r^2 distances where cell side length is 2
  R0, // same offset cell
  R4, // adjacent cells
  R5, // 1x1 next to offset cell
  R8, // kitty corner
  R9, // 1x1 next to offset cell lengthwise
  R13, // 1x1 kitty corner to offset cell
  R16, // distance 2
  R17, // distance 2 sideways from offset cell
  R20, // distance (2, 1)
  MAXR, // number of elements of R
};
class R {
  R_ r;
public:
  constexpr R() : r(R_::R0) {}
  constexpr R(R_ r) : r(r) {}
  constexpr R(size_t r) : r(static_cast<R_>(r)) {}
  operator R_() const { return r; }
  int v() const {
    switch (*this) {
    case R0: return 0;
    case R4: return 4;
    case R5: return 5;
    case R8: return 8;
    case R9: return 9;
    case R13: return 13;
    case R16: return 16;
    case R17: return 17;
    case R20: return 20;
    case MAXR: default: return -1;
    }
  }
  static constexpr R FromInt(uint8_t d) {
    switch (d) {
    case 0: return R0;
    case 4: return R4;
    case 5: return R5;
    case 8: return R8;
    case 9: return R9;
    case 13: return R13;
    case 16: return R16;
    case 17: return R17;
    case 20: return R20;
    default: return MAXR;
    }
  }
};

constexpr int RANGE = 2; // max range of 2 cells in each dimension

class Node {
public:
  // Helper class for cell resolution
  // Identity
  Location location;
  bool anti;
  R r;

  // Node properties
  // link to node for opposite value
  Node *antinode;
  Cell *cell;
  Cell::Value value;
  // Edges
  // needs to be max size for single distance plus 1
  static constexpr int MAX_DEGREE = 9;
  std::array<Node*, MAX_DEGREE> sources;
  size_t nsources;
  size_t source_index;
  Node *higher; // pointer to decrease in R (higher priority)
  Node *lower; // pointer to increase in R (lower priority)
  bool use_lower;

  // strongly connected component
  int index;
  int lowlink;
  bool on_stack;
  bool in_subcall;

  friend std::ostream& operator<<(std::ostream &os, const Node &node) {
    return os << (node.anti ? '-' : '+') << node.r.v() << node.location << node.value;
  }
};

bool Board::resolve() {
  if (check_status() != Status::RUNNING) return false;
  for (size_t y=0; y<m; ++y) {
    for (size_t x=0; x<n; ++x) {
      Cell &cell = cells.at(y, x);
      cell.previous_value = cell.value;
    }
  }
  for (const Input &input : inputs) {
    Cell &input_cell = cells.at(input.location);
    input_cell.previous_value = input.bits[step] ? Cell::Value_::ONE : Cell::Value_::ZERO;
  }
  // NB: resolve() does not call itself, so static variables are okay
  static Grid<std::array<Node, MAXR>> grid_nodes(m, n);
  static Grid<std::array<Node, MAXR>> grid_antinodes(m, n);
  // NB: Pointers into deques are safe.
  static std::deque<Node*> nodes;
  nodes.clear();
  // Construct nodes
  for (size_t y=0; y<m; ++y) {
    for (size_t x=0; x<n; ++x) {
      const Location location(y, x);
      Cell &cell = cells.at(location);
      if (!cell) continue;

      for (size_t r=0; r<MAXR; ++r) {
        Node *node = &grid_nodes.at(location)[r];
        Node *antinode = &grid_antinodes.at(location)[r];
        nodes.push_back(node);
        nodes.push_back(antinode);
        // set node properties
        node->location = location;
        antinode->location = location;
        node->anti = false;
        antinode->anti = true;
        node->r = r;
        antinode->r = r;
        node->antinode = antinode;
        antinode->antinode = node;
        node->cell = &cell;
        antinode->cell = &cell;
        node->value = Cell::Value_::UNKNOWN;
        antinode->value = Cell::Value_::UNKNOWN;
        node->nsources = 0;
        antinode->nsources = 0;
        node->source_index = 0;
        antinode->source_index = 0;
        if (r > 0) {
          node->higher = &grid_nodes.at(location)[r - 1];
          antinode->higher = &grid_antinodes.at(location)[r - 1];
          node->sources[node->nsources++] = node->higher;
          antinode->sources[antinode->nsources++] = antinode->higher;
        } else {
          node->higher = nullptr;
          antinode->higher = nullptr;
        }
        if (r + 1 < MAXR) {
          node->lower = &grid_nodes.at(location)[r + 1];
          antinode->lower = &grid_antinodes.at(location)[r + 1];
        } else {
          node->lower = nullptr;
          antinode->lower = nullptr;
        }
        node->use_lower = false;
        antinode->use_lower = false;
        node->index = 0;
        antinode->index = 0;
        node->lowlink = 0;
        antinode->lowlink = 0;
        node->on_stack = false;
        antinode->on_stack = false;
        node->in_subcall = false;
        antinode->in_subcall = false;
      }
    }
  }

  // find and add edges
  for (size_t y=0; y<m; ++y) {
    for (size_t x=0; x<n; ++x) {
      const Location location(y, x);
      Cell &cell = cells.at(location);
      if (!cell) continue;
      for (int dy=-RANGE; dy<=RANGE; ++dy) {
        for (int dx=-RANGE; dx<=RANGE; ++dx) {
          if (dy == 0 && dx == 0) continue;
          const Location delta(dy, dx);
          const Location neighbor_location = location + delta;
          if (!cells.valid(neighbor_location)) continue;
          Cell &neighbor = cells.at(neighbor_location);
          if (!neighbor) continue;
          // calculate R distance (double coordinates and account for offset)
          Location dist_delta(2 * dy, 2 * dx);
          if (cell.offset) dist_delta = dist_delta + Location(cell.direction);
          if (neighbor.offset) dist_delta = dist_delta - Location(neighbor.direction);
          const uint8_t dist = sqr(dist_delta.y) + sqr(dist_delta.x);
          // opposite orientation in same alignment have no effect
          if (cell.x != neighbor.x && cell.offset == neighbor.offset) continue;
          R r = R::FromInt(dist);
          // distance beyond simulated range of effect
          if (r == MAXR) continue;
          Node *node = &grid_nodes.at(location)[r];
          Node *antinode = &grid_antinodes.at(location)[r];
          Node *neighbor_node = &grid_nodes.at(neighbor_location)[r];
          Node *neighbor_antinode = &grid_antinodes.at(neighbor_location)[r];
          // compute whether cells are correlated or anticorrelated
          bool anti;
          if (cell.x == neighbor.x) anti = cell.x ^ (dist_delta.y == 0 || dist_delta.x == 0);
          else anti = (dist_delta.y > dist_delta.x) ^ (-dist_delta.y > dist_delta.x) ^ (dist_delta.y * dist_delta.x < 0);
          if (cell.is_diode() && cell.partner_delta * dist_delta > 0) {
            // cell.s a diode and neighbor is closer to diode partner
            if (cell.partner_delta != delta) continue;
            // partner is the sink not the source
            if (!cell.latched) continue;
          }
          if (neighbor.is_diode() && neighbor.partner_delta * dist_delta < 0) {
            // neighbor is a diode and cell.s closer to diode partner
            if (cell.partner_delta != delta) continue;
          }
          // only latched diodes cells can be affected
          if (cell.latched && !(cell.is_diode() && cell.partner_delta == delta)) continue;
          // add edges
          node->sources[node->nsources++] = anti ? neighbor_antinode : neighbor_node;
          antinode->sources[antinode->nsources++] = anti ? neighbor_node : neighbor_antinode;
        }
      }
    }
  }

  // Tarjan's algorithm
  static std::stack<Node*> callstack;
  while (!callstack.empty()) callstack.pop();
  static std::deque<Node*> scc;
  scc.clear();
  static std::deque<Node*> scc_initial;
  scc_initial.clear();
  int index = 1;
  for (Node *start : nodes) {
    if (!start->index) {
      callstack.push(start);
      while (!callstack.empty()) {
        Node *node = callstack.top();
        if (node->in_subcall) {
          // call to child was finished
          node->lowlink = std::min(node->lowlink, node->sources[node->source_index - 1]->lowlink);
          node->in_subcall = false;
          // if source was same node at higher priority and was completed, we only need that
          if (node->higher && node->higher->value) node->nsources = 1;
        } else if (!node->index) {
          // start
          node->lowlink = node->index = index++;
          scc.push_back(node);
          node->on_stack = true;
          scc_initial.push_back(node);
        }
        Node *next = nullptr;
        while (!next && node->source_index < node->nsources) {
          next = node->sources[node->source_index++];
        }
        if (next) {
          if (!next->index) {
            callstack.push(next);
            node->in_subcall = true;
          } else if (next->on_stack) {
            node->lowlink = std::min(node->lowlink, next->index);
          }
        } else {
          bool keep_on_callstack = false;
          if (node->lowlink == node->index) {
            // subtree finished and node is root of an SCC
            Cell::Value value = Cell::Value_::UNKNOWN;
            for (auto it=scc_initial.rbegin(); it!=scc_initial.rend() && (*it)->index >= node->index; ++it) {
              int weight = 0;
              int undefined = 0;
              for (size_t i=0; i<(*it)->nsources; ++i) {
                if ((*it)->sources[i] &&
                    !(*it)->sources[i]->on_stack) {
                  switch((*it)->sources[i]->value) {
                  case Cell::Value_::ZERO:
                    --weight; break;
                  case Cell::Value_::ONE:
                    ++weight; break;
                  case Cell::Value_::UNKNOWN: // TODO: error for UNKNOWN? should not happen
                  case Cell::Value_::UNDEFINED:
                    ++undefined; break;
                  }
                }
              }
              if (weight > undefined) value += Cell::Value_::ONE;
              else if (weight < -undefined) value += Cell::Value_::ZERO;
              else if (undefined) value = Cell::Value_::UNDEFINED;
            }
            if (!value) {
              // add edges from lower priority level (increase radius of effect)
              // back()->index strictly greater than node->index since we handle root separately
              while (!scc_initial.empty() && scc_initial.back()->index >= node->index) {
                Node *initial_node = scc_initial.back();
                scc_initial.pop_back();
                if (initial_node->lower && !initial_node->use_lower) {
                  initial_node->sources[initial_node->nsources++] = initial_node->lower;
                  initial_node->use_lower = true;
                  if (initial_node != node) callstack.push(initial_node);
                  keep_on_callstack = true;
                  // kill edges from same strongly connected component
                  for (size_t i=0; i<initial_node->lower->nsources; ++i) {
                    if (initial_node->lower->sources[i] &&
                        initial_node->lower->sources[i]->antinode->higher &&
                        initial_node->lower->sources[i]->antinode->higher->on_stack &&
                        initial_node->lower->sources[i]->antinode->higher->index >= node->index) {
                      initial_node->lower->sources[i] = nullptr;
                    }
                  }
                }
              }
              if (!keep_on_callstack) {
                // use previous values
                for (auto it=scc.rbegin(); it!=scc.rend() && (*it)->index >= node->index; ++it) {
                  value += (*it)->anti ? -(*it)->cell->previous_value : (*it)->cell->previous_value;
                }
                if (!value) value = Cell::Value_::UNDEFINED;
              }
            } else {
              // pop scc_initial
              while (!scc_initial.empty() && scc_initial.back()->index >= node->index) {
                scc_initial.pop_back();
              }
            }
            if (value) {
              while (!scc.empty() && scc.back()->index >= node->index) {
                scc.back()->value = value;
                scc.back()->on_stack = false;
                scc.pop_back();
              }
            }
          }
          if (!keep_on_callstack) {
            // this node is done
            callstack.pop();
          }
        }
      }
    }
  }

  // populate new cell values
  for (size_t y=0; y<m; ++y) {
    for (size_t x=0; x<n; ++x) {
      const Location location(y, x);
      Cell &cell = cells.at(location);
      // highest priority node has the value
      const Node &node = grid_nodes.at(location)[0];
      if (cell) cell.value = node.value;
    }
  }

  return false;
}

} // namespace puzzle
