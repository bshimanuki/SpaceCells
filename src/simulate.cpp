#include "simulate.h"

#include <algorithm>
#include <array>
#include <deque>
#include <functional>
#include <iostream>
#include <queue>
#include <sstream>
#include <string>
#include <stack>
#include <tuple>
#include <vector>
#include <utility>

namespace puzzle {


const Error Error::OutOfRange("Out of range error");
const Error Error::InvalidInput("Invalid input");


Color::Color(char c) {
  switch (c) {
  // cells
  case '/': *this = Color_::BLUE; break;
  case '\\': *this = Color_::GREEN; break;
  case '-': *this = Color_::RED; break;
  case '|': *this = Color_::ORANGE; break;
  // color codes
  case 'K': *this = Color_::BLACK; break;
  case 'N': *this = Color_::BROWN; break;
  case 'R': *this = Color_::RED; break;
  case 'O': *this = Color_::ORANGE; break;
  case 'Y': *this = Color_::YELLOW; break;
  case 'G': *this = Color_::GREEN; break;
  case 'B': *this = Color_::BLUE; break;
  case 'P': *this = Color_::PURPLE; break;
  case 'W': *this = Color_::WHITE; break;
  case 'C': *this = Color_::CYAN; break;
  case 'E': *this = Color_::REDORANGE; break;
  default: *this = Color_::INVALID; break;
  }
}

std::ostream& operator<<(std::ostream &os, const Color &color) {
  switch (color) {
  case Color_::BLACK: return os << "K";
  case Color_::BROWN: return os << "N";
  case Color_::RED: return os << "R";
  case Color_::ORANGE: return os << "O";
  case Color_::YELLOW: return os << "Y";
  case Color_::GREEN: return os << "G";
  case Color_::BLUE: return os << "B";
  case Color_::PURPLE: return os << "P";
  case Color_::WHITE: return os << "W";
  case Color_::CYAN: return os << "C";
  case Color_::REDORANGE: return os << "E";
  case Color_::INVALID: default: return os << "#";
  }
}

Color operator+(const Color &lhs, const Color &rhs) {
  if (lhs == Color_::INVALID || rhs == Color_::INVALID) return Color_::INVALID;
  if (lhs == rhs) return lhs;
  // check black before white
  if (lhs == Color_::BLACK) return rhs;
  if (rhs == Color_::BLACK) return lhs;
  if (lhs == Color_::WHITE) return rhs;
  if (rhs == Color_::WHITE) return lhs;
  switch (lhs) {
  case Color_::RED:
    switch (rhs) {
    case Color_::ORANGE: return Color_::REDORANGE;
    case Color_::YELLOW: return Color_::ORANGE;
    case Color_::GREEN: return Color_::YELLOW;
    case Color_::BLUE: return Color_::PURPLE;
    case Color_::CYAN: return Color_::WHITE;
    default: break;
    }
    break;
  case Color_::ORANGE:
    switch (rhs) {
    case Color_::RED: return Color_::REDORANGE;
    case Color_::GREEN: return Color_::BROWN;
    case Color_::BLUE: return Color_::WHITE;
    default: break;
    }
    break;
  case Color_::YELLOW:
    switch (rhs) {
    case Color_::RED: return Color_::ORANGE;
    case Color_::BLUE: return Color_::WHITE;
    default: break;
    }
    break;
  case Color_::GREEN:
    switch (rhs) {
    case Color_::RED: return Color_::YELLOW;
    case Color_::ORANGE: return Color_::BROWN;
    case Color_::BLUE: return Color_::CYAN;
    case Color_::PURPLE: return Color_::WHITE;
    default: break;
    }
    break;
  case Color_::BLUE:
    switch (rhs) {
    case Color_::RED: return Color_::PURPLE;
    case Color_::ORANGE: return Color_::WHITE;
    case Color_::YELLOW: return Color_::WHITE;
    case Color_::GREEN: return Color_::CYAN;
    default: break;
    }
    break;
  case Color_::PURPLE:
    switch (rhs) {
    case Color_::GREEN: return Color_::WHITE;
    default: break;
    }
    break;
  case Color_::CYAN:
    switch (rhs) {
    case Color_::RED: return Color_::WHITE;
    default: break;
    }
    break;
  default:
    break;
  }
  // all other combinations do not have names
  return Color_::UNNAMED;
}


Direction::Direction(char c) {
  switch (c) {
  case '<':
    *this = Direction_::LEFT;
    break;
  case 'v':
    *this = Direction_::DOWN;
    break;
  case '>':
    *this = Direction_::RIGHT;
    break;
  case '^':
    *this = Direction_::UP;
    break;
  default:
    *this = Direction_::NONE;
    break;
  }
}

Direction::operator Location() const  {
  switch (*this) {
  case Direction_::LEFT: return Location(0, -1);
  case Direction_::DOWN: return Location(1, 0);
  case Direction_::RIGHT: return Location(0, 1);
  case Direction_::UP: return Location(-1, 0);
  case Direction_::NONE: default: return Location();
  }
}

Direction::operator std::string() const {
  switch (*this) {
  case Direction_::LEFT:
    return "<";
  case Direction_::DOWN:
    return "v";
  case Direction_::RIGHT:
    return ">";
  case Direction_::UP:
    return "^";
  case Direction_::NONE:
  default:
    return " ";
  }
}


Cell::Value::Value(char c) {
  switch (c) {
    case '0': v = Value_::ZERO; break;
    case '1': v = Value_::ONE; break;
    default: v = Value_::UNDEFINED; break;
  }
}

Cell::Value Cell::Value::operator-() const {
  switch (*this) {
  case Value_::UNKNOWN: return Value_::UNKNOWN;
  case Value_::ZERO: return Value_::ONE;
  case Value_::ONE: return Value_::ZERO;
  case Value_::UNDEFINED: default: return Value_::UNDEFINED;
  }
}

Cell::Value operator+(const Cell::Value &a, const Cell::Value &b) {
  if (a == b) return a;
  if (a == Cell::Value_::UNKNOWN) return b;
  if (b == Cell::Value_::UNKNOWN) return a;
  return Cell::Value_::UNDEFINED;
}

Cell::Value::operator std::string() const {
  switch (*this) {
  case Value_::UNKNOWN: return "?";
  case Value_::ZERO: return "0";
  case Value_::ONE: return "1";
  case Value_::UNDEFINED: default: return "x";
  }
}

Cell Cell::_Cell(char c) {
  switch (c) {
  case 'x':
    return UnlatchedCell(true);
  case '+':
    return UnlatchedCell(false);
  case '/':
    return LatchedCell(true, Value_::ONE);
  case '\\':
    return LatchedCell(true, Value_::ZERO);
  case '-':
    return LatchedCell(false, Value_::ONE);
  case '|':
    return LatchedCell(false, Value_::ZERO);
  case ']':
    return OffsetCell(Direction_::LEFT);
  case '[':
    return OffsetCell(Direction_::RIGHT);
  case 'W':
    return OffsetCell(Direction_::UP);
  case 'M':
    return OffsetCell(Direction_::DOWN);
  default:
    return Cell();
  }
}

Cell Cell::UnlatchedCell(bool x) {
  Cell c{};
  c.exists = true;
  c.x = x;
  return c;
}

Cell Cell::LatchedCell(bool x, Value v) {
  Cell c{};
  c.exists = true;
  c.latched = true;
  c.x = x;
  c.value = v;
  return c;
}

Cell Cell::OffsetCell(Direction direction) {
  Cell c = UnlatchedCell(true);
  c.offset = true;
  c.direction = direction;
  switch (direction) {
  case Direction_::LEFT: c.partner_delta = {0, 1}; break;
  case Direction_::DOWN: c.partner_delta = {-1, 0}; break;
  case Direction_::RIGHT: c.partner_delta = {0, -1}; break;
  case Direction_::UP: c.partner_delta = {1, 0}; break;
  default: break;
  }
  return c;
}

std::pair<Cell, Cell> Cell::Diode(Direction direction) {
  Cell src = UnlatchedCell(true);
  Cell dest = LatchedCell(true, Value_::UNKNOWN);
  src.direction = direction;
  dest.direction = direction;
  switch (direction) {
  case Direction_::LEFT:
    src.partner_delta = {0, -1};
    dest.partner_delta = {0, 1};
    break;
  case Direction_::DOWN:
    src.partner_delta = {1, 0};
    dest.partner_delta = {-1, 0};
    break;
  case Direction_::RIGHT:
    src.partner_delta = {0, 1};
    dest.partner_delta = {0, -1};
    break;
  case Direction_::UP:
    src.partner_delta = {-1, 0};
    dest.partner_delta = {1, 0};
    break;
  default: break;
  }
  return {src, dest};
}

Cell::operator char() const {
  // empty
  if (!exists) return ' ';
  // offset cells
  if (offset) {
    switch (direction) {
    case Direction_::NONE:
      return '#'; // error
    case Direction_::LEFT:
      return ']';
    case Direction_::DOWN:
      return 'M';
    case Direction_::RIGHT:
      return '[';
    case Direction_::UP:
      return 'W';
    }
  }
  // diode
  switch (direction) {
  case Direction_::NONE:
    break;
  case Direction_::LEFT:
    return latched ? '<' : 'x';
  case Direction_::DOWN:
    return latched ? 'v' : 'x';
  case Direction_::RIGHT:
    return latched ? '>' : 'x';
  case Direction_::UP:
    return latched ? '^' : 'x';
  }
  // 1x1 cell
  if (latched) return resolved();
  return x ? 'x': '+';
}

char Cell::resolved() const {
  if (!exists) return ' ';
  switch (value) {
  case Value_::ZERO:
    return x ? '\\': '|';
  case Value_::ONE:
    return x ? '/': '-';
  case Value_::UNKNOWN:
  case Value_::UNDEFINED:
  default:
    return x ? 'x': '+';
  }
}

Cell::operator Color() const {
  switch (*this) {
  case '/':
    return Color_::BLUE;
  case '\\':
    return Color_::GREEN;
  case '-':
    return Color_::RED;
  case '|':
    return Color_::ORANGE;
  case 'x':
  case '[':
  case ']':
  case 'W':
  case 'M':
  case '<':
  case 'v':
  case '>':
  case '^':
    switch (value) {
    case Value_::ONE: return Color_::BLUE;
    case Value_::ZERO: return Color_::GREEN;
    default: return Color_::INVALID;
    }
  case '+':
    switch (value) {
    case Value_::ONE: return Color_::RED;
    case Value_::ZERO: return Color_::ORANGE;
    default: return Color_::INVALID;
    }
  case ' ':
    return Color_::BLACK;
  default:
    return Color_::INVALID;
  }
}

bool Cell::is_1x1() const {
  return exists && !partner_delta;
}
bool Cell::is_grabbable() const {
  return is_1x1();
}
bool Cell::is_latchable() const {
  return is_1x1();
}
bool Cell::is_refreshable() const {
  return is_1x1() && latched;
}
bool Cell::is_rotateable() const {
  return is_1x1();
}
bool Cell::is_diode() const {
  return direction && !offset;
}

Operation Operation::Operation_(char c) {
  switch (c) {
  case GRAB.c: return GRAB;
  case DROP.c: return DROP;
  case SWAP.c: return SWAP;
  case SYNC.c: return SYNC;
  case BRANCH_LEFT_ONE.c: return BRANCH_LEFT_ONE;
  case BRANCH_DOWN_ONE.c: return BRANCH_DOWN_ONE;
  case BRANCH_RIGHT_ONE.c: return BRANCH_RIGHT_ONE;
  case BRANCH_UP_ONE.c: return BRANCH_UP_ONE;
  case BRANCH_LEFT_ZERO.c: return BRANCH_LEFT_ZERO;
  case BRANCH_DOWN_ZERO.c: return BRANCH_DOWN_ZERO;
  case BRANCH_RIGHT_ZERO.c: return BRANCH_RIGHT_ZERO;
  case BRANCH_UP_ZERO.c: return BRANCH_UP_ZERO;
  case START.c: return START;
  case ROTATE.c: return ROTATE;
  case UNLATCH.c: return UNLATCH;
  case LATCH.c: return LATCH;
  case TOGGLE_LATCH.c: return TOGGLE_LATCH;
  case REFRESH.c: return REFRESH;
  case POWER_A.c: return POWER_A;
  case POWER_B.c: return POWER_B;
  case NEXT.c: return NEXT;
  case NONE.c: default: return NONE;
  }
}

Operation::operator char() const {
  switch (type) {
  case Type::NONE:
    return ' ';
  case Type::SWAP:
    switch (value) {
    case 0b01: return 'g';
    case 0b10: return 'd';
    case 0b11: return 'w';
    default: return '#'; // error
    }
  case Type::SYNC:
    return 's';
  case Type::BRANCH:
    switch (value) {
    case 0b0101: // /-
      switch (direction) {
      case Direction_::LEFT: return '<';
      case Direction_::DOWN: return 'v';
      case Direction_::RIGHT: return '>';
      case Direction_::UP: return '^';
      default: return '#'; // error
      }
    case 0b1010: // \|
      switch (direction) {
      case Direction_::LEFT: return '[';
      case Direction_::DOWN: return 'W';
      case Direction_::RIGHT: return ']';
      case Direction_::UP: return 'M';
      default: return '#'; // error
      }
    default: return '#'; // error
    }
  case Type::START:
    return 'S';
  case Type::ROTATE:
    return 'r';
  case Type::LATCH:
    switch (value) {
    case 0b01: return 'u';
    case 0b10: return 'l';
    case 0b11: return 't';
    default: return '#'; // error
    }
  case Type::REFRESH:
    return '*';
  case Type::POWER:
    switch (value) {
    case 0b0: return 'p';
    case 0b1: return 'P';
    default: return '#'; // error
    }
  case Type::NEXT:
    return 'n';
  default:
    return '#'; // error
  }
}


Board::Board(size_t m, size_t n, size_t nbots) :
    m(m), n(n), nbots(nbots),
    initial_cells(m, n),
    trespassable(m, n),
    directions(nbots, {m, n}),
    operations(nbots, {m, n}),
    bots(nbots),
    cells(m, n) {}

bool Board::add_input(size_t y, size_t x) {
  if (y >= m || x >= n) {
    error = Error::OutOfRange;
    return true;
  }
  inputs.push_back({Location(y, x), {}});
  return false;
}

bool Board::add_output(size_t y, size_t x) {
  if (y >= m || x >= n) {
    error = Error::OutOfRange;
    return true;
  }
  outputs.push_back({Location(y, x)});
  return false;
}

bool Board::set_input(size_t k, const std::string &bits) {
  if (k > inputs.size()) {
    error = Error::OutOfRange;
    return true;
  }
  if (std::any_of(bits.begin(), bits.end(), [](char b){ return (b & '0') != '0'; })) {
    error = Error::InvalidInput;
    return true;
  }
  inputs[k].bits.resize(bits.size());
  std::transform(bits.begin(), bits.end(), inputs[k].bits.begin(), [](char b){ return b == '1'; });
  return false;
}

bool Board::set_output_colors(const std::string &colors) {
  if (std::any_of(colors.begin(), colors.end(), [](char c){ return Color(c) == Color(Color_::INVALID); })) {
    error = Error::InvalidInput;
    return true;
  }
  output_colors.resize(colors.size());
  std::copy(colors.begin(), colors.end(), output_colors.begin());
  return false;
}

bool Board::set_cells(const std::string &grid_cells) {
  initial_cells.reset();
  std::stringstream ss(grid_cells);
  std::string line;
  for (size_t y=0; y<m; ++y) {
    std::getline(ss, line);
    if (line.size() != n) {
      error = Error::InvalidInput;
      return true;
    }
    for (size_t x=0; x<n; ++x) {
      char c = line[x];
      // specially set multi-square cells
      switch (c) {
      case '<':
        if (x + 1 < n) std::tie(initial_cells[y][x+1], initial_cells[y][x]) = Cell::Diode(Direction_::LEFT);
        break;
      case 'v':
        if (y > 0) std::tie(initial_cells[y-1][x], initial_cells[y][x]) = Cell::Diode(Direction_::DOWN);
        break;
      case '>':
        if (x > 0) std::tie(initial_cells[y][x-1], initial_cells[y][x]) = Cell::Diode(Direction_::RIGHT);
        break;
      case '^':
        if (y + 1 < m) std::tie(initial_cells[y+1][x], initial_cells[y][x]) = Cell::Diode(Direction_::UP);
        break;
      }
      // set 1x1 cells
      if (!initial_cells[y][x].exists) initial_cells[y][x] = Cell(c);
      // if (!initial_cells[y][x].exists && c != ' ') return error = Error::InvalidInput;
    }
  }
  // check for multi-square consistency
  for (size_t y=0; y<m; ++y) {
    for (size_t x=0; x<n; ++x) {
      if (initial_cells[y][x].partner_delta) {
        const Cell* partner = initial_cells.partner(Location(y, x));
        if (!partner || initial_cells[y][x].partner_delta != -partner->partner_delta) {
          return error = Error::InvalidInput;
        }
      }
    }
  }
  if (ss.peek() != EOF) return error = Error::InvalidInput;
  return false;
}

bool Board::set_instructions(size_t k, const std::string &grid_directions, const std::string &grid_operations) {
  if (k >= nbots) {
    error = Error::OutOfRange;
    return true;
  }
  bool invalid = false;
  invalid |= directions[k].reset(grid_directions);
  invalid |= operations[k].reset(grid_operations);
  if (invalid) error = Error::InvalidInput;
  return invalid;
}

bool Board::reset_and_validate(const std::string &grid_fixed) {
  std::stringstream ss(grid_fixed);
  std::string line;
  for (auto &bot : bots) bot = Bot();
  trespassable.reset(true);
  for (auto &input : inputs) {
    trespassable.at(input.location) = false;
  }
  for (auto &output : outputs) {
    trespassable.at(output.location) = false;
    output.power = true;
  }
  // check grids
  for (size_t y=0; y<m; ++y) {
    std::getline(ss, line);
    if (line.size() != n) {
      error = Error::InvalidInput;
      return true;
    }
    // validate cells
    for (size_t x=0; x<n; ++x) {
      switch (line[x]) {
      case ' ':
        break;
      case '.':
        if (initial_cells[y][x]) return error = Error::InvalidInput;
        break;
      case '<':
        if (x <= 0 || initial_cells[y][x] != initial_cells[y][x-1]) return error = Error::InvalidInput;
        break;
      case 'v':
        if (y + 1 >= m || initial_cells[y][x] != initial_cells[y+1][x]) return error = Error::InvalidInput;
        break;
      case '>':
        if (x + 1 >= n || initial_cells[y][x] != initial_cells[y][x+1]) return error = Error::InvalidInput;
        break;
      case '^':
        if (y <= 0 || initial_cells[y][x] != initial_cells[y-1][x]) return error = Error::InvalidInput;
        break;
      default:
        if (initial_cells[y][x] != line[x]) return error = Error::InvalidInput;
        Location location(y, x);
        const Cell &cell = initial_cells[y][x];
        const Cell *partner = initial_cells.partner(location);
        switch (cell) {
        case '<':
        case 'v':
        case '>':
        case '^':
          if (!partner || *partner != 'x') return error = Error::InvalidInput;
          if (!partner || cell.partner_delta != -partner->partner_delta) return error = Error::InvalidInput;
          if (!partner || cell.direction != partner->direction) return error = Error::InvalidInput;
          break;
        case '[':
          if (!partner || cell.partner_delta != -partner->partner_delta) return error = Error::InvalidInput;
          if (!partner || *partner != ']') return error = Error::InvalidInput;
          break;
        case ']':
          if (!partner || cell.partner_delta != -partner->partner_delta) return error = Error::InvalidInput;
          if (!partner || *partner != '[') return error = Error::InvalidInput;
          break;
        case 'W':
          if (!partner || cell.partner_delta != -partner->partner_delta) return error = Error::InvalidInput;
          if (!partner || *partner != 'M') return error = Error::InvalidInput;
          break;
        case 'M':
          if (!partner || cell.partner_delta != -partner->partner_delta) return error = Error::InvalidInput;
          if (!partner || *partner != 'W') return error = Error::InvalidInput;
          break;
        default:
          break;
        }
        break;
      }
      // set non trespassable
      switch (line[x]) {
      case ' ': break;
      default: trespassable[y][x] = false; break;
      }
      // validate instructions
      if (!trespassable[y][x]) {
        for (const auto &_directions : directions) if (_directions[y][x]) return error = Error::InvalidInput;
        for (const auto &_operations : operations) if (_operations[y][x]) return error = Error::InvalidInput;
      }
      // check bot start locations
      for (size_t k=0; k<nbots; ++k) {
        if (operations[k][y][x].type == Operation::Type::START) {
          if (bots[k]) {
            error = Error("Bot has multiple START instructions");
            return true;
          }
          bots[k] = Bot(Location(y, x));
        }
      }
    }
  }
  // ensure each bot has a start location
  for (size_t k=0; k<nbots; ++k) {
    if (!bots[k].location.valid) {
      error = Error("Bot does not have a START instruction");
      return true;
    }
  }
  // check I/O sequence sizes
  for (const Input &input : inputs) {
    if (input.bits.size() != output_colors.size()) return error = Error::InvalidInput;
  }
  // reset state
  cells = initial_cells;
  step = 0;
  for (const Input &input : inputs) {
    Cell &input_cell = cells.at(input.location);
    if (input_cell != 'x' && input_cell != '+') return error = Error::InvalidInput;
    input_cell.latched = true;
  }
  if (resolve()) return true;
  return false;
}

bool Board::move() {
  if (check_status() != Status::RUNNING) return false;
  bool next = false;
  size_t syncing = 0;
  // toggle states
  for (size_t k=0; k<nbots; ++k) {
    auto &bot = bots[k];
    const auto &direction = directions[k].at(bot.location);
    const auto &operation = operations[k].at(bot.location);
    auto &cell = cells.at(bot.location);
    if (direction) bot.moving = direction;
    switch (operation.type) {
    case Operation::Type::SWAP:
      if (cell.is_grabbable()) {
        if (bot.holding) {
          if (operation.value & Operation::DROP.op.value)  {
            bot.holding = false;
            cell.held = false;
          }
        } else {
          if (!cell.held && operation.value & Operation::GRAB.op.value)  {
            bot.holding = true;
            cell.held = true;
          }
        }
      }
      break;
    case Operation::Type::SYNC:
      ++syncing;
      break;
    case Operation::Type::BRANCH:
      if (cell) {
        switch (cell.value) {
        case Cell::Value_::ONE:
          if (operation.value & (0b01 << (2 * !cell.x))) bot.moving = operation.direction;
          break;
        case Cell::Value_::ZERO:
          if (operation.value & (0b10 << (2 * !cell.x))) bot.moving = operation.direction;
          break;
        default:
          if (operation.value & (0b11 << (2 * !cell.x))) {
            invalid = true;
            return error = Error("Branch on undetermined state");
          }
          break;
        }
      }
      break;
    case Operation::Type::START:
      break;
    case Operation::Type::ROTATE:
      bot.rotating ^= true;
      if (cell.is_rotateable()) {
        cell.rotating = true;
      }
      break;
    case Operation::Type::LATCH:
    case Operation::Type::REFRESH:
    case Operation::Type::POWER:
    case Operation::Type::NEXT:
      // toggles happen between movement and resolution
      break;
    case Operation::Type::NONE:
    default:
      break;
    }
  }
  // set cell movement
  for (size_t k=0; k<nbots; ++k) {
    const auto &bot = bots[k];
    const auto &operation = operations[k].at(bot.location);
    auto &cell = cells.at(bot.location);
    Location dest = bot.location + Location(bot.moving);
    if (bot.holding) {
      if (operation.type == Operation::Type::SYNC && syncing <= 1) {
        cell.moving = Direction_::NONE;
      } else if (bot.rotating) {
        cell.moving = Direction_::NONE;
      } else if (!trespassable.valid(dest) || !trespassable.at(dest)) {
        // stops at boundary
        cell.moving = false;
      } else {
        cell.moving = bot.moving;
      }
    }
  }
  // check cell collisions
  for (const auto &bot : bots) {
    const Cell &cell = cells.at(bot.location);
    if (cell.moving) {
      Location dest = bot.location + Location(cell.moving);
      if (!trespassable.valid(dest) || !trespassable.at(dest)) {
        // will not activate since we stop at boundary instead
        invalid = true;
        return error = Error("Collided with boundary");
      }
      Cell &next_cell = cells.at(dest);
      if (next_cell) {
        if (next_cell.moving != cell.moving) {
          // collided with cell
          invalid = true;
          return error = Error("Cells collided");
        }
      }
    }
  }
  // move cells
  for (size_t k=0; k<nbots; ++k) {
    // NB: move doesn't call itself so we can use static variables
    static std::stack<Location> st;
    while (!st.empty()) st.pop();
    auto &bot = bots[k];
    st.push(bot.location);
    while(!st.empty()) {
      Location location = st.top();
      Cell &cell = cells.at(location);
      if (cell.rotating) {
        cell.value = -cell.value;
        cell.rotating = false;
      }
      if (cell.moving) {
        Location dest = location + Location(cell.moving);
        Cell &next_cell = cells.at(dest);
        if (next_cell) {
          // need to move the next cell first
          // (already checked that cell moves out of the way)
          st.push(dest);
          continue;
        } else {
          // space is empty, cell can move
          next_cell = cell;
          cell = Cell();
          next_cell.moving = false;
        }
      }
      st.pop();
    }
  }
  // move bots
  for (size_t k=0; k<nbots; ++k) {
    auto &bot = bots[k];
    const auto &operation = operations[k].at(bot.location);
    if (operation.type == Operation::Type::SYNC && syncing <= 1) {
      continue;
    } else if (bot.rotating) {
      continue;
    } else {
      // bot can move
      Location dest = bot.location + Location(bot.moving);
      if (!trespassable.valid(dest) || !trespassable.at(dest)) {
        // stop at boundary
        continue;
        // invalid = true;
        // return error = Error("Collided with boundary");
      }
      bot.location = dest;
    }
  }
  // pre resolve latches and checks
  for (size_t k=0; k<nbots; ++k) {
    const auto &bot = bots[k];
    const Operation &operation = operations[k].at(bot.location);
    Cell &cell = cells.at(bot.location);
    switch (operation.type) {
    case Operation::Type::LATCH:
      if (cell.is_latchable()) {
        if (cell.latched) {
          if (operation.value & Operation::UNLATCH.op.value)  {
            cell.latched = false;
          }
        } else {
          if (operation.value & Operation::LATCH.op.value)  {
            cell.refreshing = true;
          }
        }
      }
      break;
    case Operation::Type::REFRESH:
      if (cell.is_refreshable() && cell.latched) {
        cell.latched = false;
        cell.refreshing = true;
      }
      break;
    case Operation::Type::POWER:
      if (operation.value < outputs.size()) {
        outputs[operation.value].toggle_power = true;
      }
      break;
    case Operation::Type::NEXT:
      next = true;
      break;
    default:
      break;
    }
  }
  for (auto &output : outputs) {
    output.power ^= output.toggle_power;
    output.toggle_power = false;
  }
  // resolve
  if (resolve()) return true;
  // post resolve latches
  for (size_t k=0; k<nbots; ++k) {
    const auto &bot = bots[k];
    Cell &cell = cells.at(bot.location);
    if (cell.refreshing) {
      cell.latched = true;
      cell.refreshing = false;
    }
  }
  if (next) {
    Color color = Color_::BLACK;
    for (const auto& output : outputs) {
      if (output.power) {
        color = color + Color(cells.at(output.location));
      }
    }
    if (color == Color_::INVALID) {
      invalid = true;
      return error = Error("Output is in undetermined state");
    }
    if (color != output_colors[step]) {
      // std::cerr << "Output " << color << " instead of " << output_colors[step] << std::endl;
      invalid = true;
      return error = Error("Wrong output");
    }
    ++step;
  }
  return false;
}

std::pair<bool, bool> Board::run(size_t max_cycles, bool print_board) {
  // make sure it starts resolved
  if (resolve()) {
    return {false, invalid};
  }
  if (print_board) std::cout << "Cycle 0:" << std::endl << get_resolved_board();
  for (size_t cycle=0; cycle<max_cycles; ++cycle) {
    if (move()) {
      return {false, invalid};
    }
    if (print_board) std::cout << "Cycle " << (cycle + 1) << ":" << std::endl << get_resolved_board();
    switch (check_status()) {
    case Status::INVALID:
      return {false, false};
    case Status::RUNNING:
      break;
    case Status::DONE:
      return {true, false};
    }
  }
  error = Error(Formatter() << "Did not complete within " << max_cycles << " cycles");
  return {false, false};
}

Status Board::check_status() const {
  if (invalid) return Status::INVALID;
  if (step >= output_colors.size()) return Status::DONE;
  return Status::RUNNING;
}

std::string Board::get_error() const {
  return error;
}

std::string Board::get_unresolved_board() const {
  std::stringstream ss;
  for (const auto &line : cells) {
    for (const auto &square : line) {
      ss << square;
    }
    ss << std::endl;
  }
  return ss.str();
}

std::string Board::get_resolved_board() const {
  std::stringstream ss;
  for (const auto &line : cells) {
    for (const auto &square : line) {
      ss << square.resolved();
    }
    ss << std::endl;
  }
  return ss.str();
}

std::vector<Bot> Board::get_bots() const {
  return bots;
}


} // namespace puzzle
