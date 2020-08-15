#include "simulate.h"

#include <algorithm>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>
#include <utility>

namespace qca {


const QCAError QCAError::OutOfRange("Out of range error");
const QCAError QCAError::InvalidInput("Invalid input");


Color::Color(char c) {
  switch (c) {
  // cells
  case '/': *this = BLUE; break;
  case '\\': *this = GREEN; break;
  case '-': *this = RED; break;
  case '|': *this = ORANGE; break;
  // color codes
  case 'K': *this = BLACK; break;
  case 'N': *this = BROWN; break;
  case 'R': *this = RED; break;
  case 'O': *this = ORANGE; break;
  case 'Y': *this = YELLOW; break;
  case 'G': *this = GREEN; break;
  case 'B': *this = BLUE; break;
  case 'P': *this = PURPLE; break;
  case 'W': *this = WHITE; break;
  case 'C': *this = CYAN; break;
  case 'E': *this = REDORANGE; break;
  default: *this = INVALID; break;
  }
}

Color::operator std::string() const {
  switch (*this) {
  case BLACK: return "K";
  case BROWN: return "N";
  case RED: return "R";
  case ORANGE: return "O";
  case YELLOW: return "Y";
  case GREEN: return "G";
  case BLUE: return "B";
  case PURPLE: return "P";
  case WHITE: return "W";
  case CYAN: return "C";
  case REDORANGE: return "E";
  case INVALID: default: return "#";
  }
}

Color Color::operator+(const Color &oth) const {
  if (*this == oth) return *this;
  // check black before white
  if (*this == BLACK) return oth;
  if (oth == BLACK) return *this;
  if (*this == WHITE) return oth;
  if (oth == WHITE) return *this;
  switch (*this) {
  case RED:
    switch (oth) {
    case ORANGE: return REDORANGE;
    case YELLOW: return ORANGE;
    case GREEN: return YELLOW;
    case BLUE: return PURPLE;
    case CYAN: return WHITE;
    default: break;
    }
    break;
  case ORANGE:
    switch (oth) {
    case RED: return REDORANGE;
    case GREEN: return BROWN;
    case BLUE: return WHITE;
    default: break;
    }
    break;
  case YELLOW:
    switch (oth) {
    case RED: return ORANGE;
    case BLUE: return WHITE;
    default: break;
    }
    break;
  case GREEN:
    switch (oth) {
    case RED: return YELLOW;
    case ORANGE: return BROWN;
    case BLUE: return CYAN;
    case PURPLE: return WHITE;
    default: break;
    }
    break;
  case BLUE:
    switch (oth) {
    case RED: return PURPLE;
    case ORANGE: return WHITE;
    case YELLOW: return WHITE;
    case GREEN: return CYAN;
    default: break;
    }
    break;
  case PURPLE:
    switch (oth) {
    case GREEN: return WHITE;
    default: break;
    }
    break;
  case CYAN:
    switch (oth) {
    case RED: return WHITE;
    default: break;
    }
    break;
  default:
    break;
  }
  return INVALID;
}


Direction::Direction(char c) {
  switch (c) {
  case '<':
    *this = Direction::LEFT;
    break;
  case 'v':
    *this = Direction::DOWN;
    break;
  case '>':
    *this = Direction::RIGHT;
    break;
  case '^':
    *this = Direction::UP;
    break;
  default:
    *this = Direction::NONE;
    break;
  }
}

Direction::operator std::string() const {
  switch (*this) {
  case Direction::NONE:
    return " ";
  case Direction::LEFT:
    return "]";
  case Direction::DOWN:
    return "M";
  case Direction::RIGHT:
    return "[";
  case Direction::UP:
    return "W";
  }
}


Cell Cell::_Cell(char c) {
  switch (c) {
  case 'x':
    return UnlatchedCell(true);
  case '+':
    return UnlatchedCell(false);
  case '/':
    return LatchedCell(true, Value::ONE);
  case '\\':
    return LatchedCell(true, Value::ZERO);
  case '-':
    return LatchedCell(false, Value::ONE);
  case '|':
    return LatchedCell(false, Value::ZERO);
  default:
    return Cell();
  }
}

Cell Cell::UnlatchedCell(bool x) {
  Cell c;
  c.exists = true;
  c.x = x;
  return c;
}

Cell Cell::LatchedCell(bool x, Value v) {
  Cell c;
  c.exists = true;
  c.latched = true;
  c.x = x;
  c.value = v;
  return c;
}

void Cell::OffsetCell(bool horizontal, Cell *c1, Cell *c2) {
  *c1 = UnlatchedCell(true);
  *c2 = UnlatchedCell(true);
  c1->offset = true;
  c2->offset = true;
  c1->partner = c2;
  c2->partner = c1;
  c1->direction = horizontal ? Direction::LEFT : Direction::UP;
  c2->direction = horizontal ? Direction::RIGHT : Direction::DOWN;
}

void Cell::Diode(Direction direction, Cell *src, Cell *dest) {
  *src = UnlatchedCell(true);
  *dest = LatchedCell(true, Value::UNKNOWN);
  src->direction = direction;
  dest->direction = direction;
  src->partner = dest;
  dest->partner = src;
}

Cell::operator char() const {
  // empty
  if (!this->exists) return ' ';
  // offset cells
  if (this->offset) {
    switch (this->direction) {
    case Direction::NONE:
      return '#'; // error
    case Direction::LEFT:
      return ']';
    case Direction::DOWN:
      return 'M';
    case Direction::RIGHT:
      return '[';
    case Direction::UP:
      return 'W';
    }
  }
  // diode
  switch (this->direction) {
  case Direction::NONE:
    break;
  case Direction::LEFT:
    return this->latched ? 'x' : '<';
  case Direction::DOWN:
    return this->latched ? 'x' : 'v';
  case Direction::RIGHT:
    return this->latched ? 'x' : '>';
  case Direction::UP:
    return this->latched ? 'x' : '^';
  }
  // 1x1 cell
  switch (this->value) {
  case Value::ZERO:
    return this->x ? '\\': '|';
  case Value::ONE:
    return this->x ? '/': '-';
  case Value::UNKNOWN:
  case Value::UNDETERMINED:
    return this->x ? 'x': '+';
  }
}

char Cell::resolved() const {
  if (!this->exists) return ' ';
  switch (this->value) {
  case Value::ZERO:
    return this->x ? '\\': '|';
  case Value::ONE:
    return this->x ? '/': '-';
  case Value::UNKNOWN:
  case Value::UNDETERMINED:
    return this->x ? 'x': '+';
  }
}


Operation::Operation(char c) {
  switch (c) {
  case 'g': // GRAB
    type = Type::SWAP; value = 0b01; break;
  case 'd': // DROP
    type = Type::SWAP; value = 0b10; break;
  case 'w': // SWAP
    type = Type::SWAP; value = 0b11; break;
  case 's': // SYNC
    type = Type::SYNC; break;
  case '<': // BRANCH < /-
    type = Type::BRANCH; direction = Direction::LEFT; value = 0b0101; break;
  case 'v': // BRANCH v /-
    type = Type::BRANCH; direction = Direction::DOWN; value = 0b0101; break;
  case '>': // BRANCH > /-
    type = Type::BRANCH; direction = Direction::RIGHT; value = 0b0101; break;
  case '^': // BRANCH ^ /-
    type = Type::BRANCH; direction = Direction::UP; value = 0b0101; break;
  case '[': // BRANCH < \|
    type = Type::BRANCH; direction = Direction::LEFT; value = 0b1010; break;
  case 'W': // BRANCH v \|
    type = Type::BRANCH; direction = Direction::DOWN; value = 0b1010; break;
  case ']': // BRANCH > \|
    type = Type::BRANCH; direction = Direction::RIGHT; value = 0b1010; break;
  case 'M': // BRANCH ^ \|
    type = Type::BRANCH; direction = Direction::UP; value = 0b1010; break;
  case 'S': // START
    type = Type::START; break;
  case 'r': // ROTATE
    type = Type::ROTATE; break;
  case 'u': // UNLATCH
    type = Type::LATCH; value = 0b01; break;
  case 'l': // LATCH
    type = Type::LATCH; value = 0b10; break;
  case 't': // TOGGLE LATCH
    type = Type::LATCH; value = 0b11; break;
  case '*': // REFRESH
    type = Type::REFRESH; break;
  case 'p': // POWER
    type = Type::POWER; value = 0b0; break;
  case 'P': // POWER
    type = Type::POWER; value = 0b1; break;
  case 'n': // NEXT
    type = Type::NEXT; break;
  default:
    type = Type::NONE; break;
  }
}

Operation::operator char() const {
  switch (type) {
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
      case Direction::LEFT: return '<';
      case Direction::DOWN: return 'v';
      case Direction::RIGHT: return '>';
      case Direction::UP: return '^';
      default: return '#'; // error
      }
    case 0b1010: // \|
      switch (direction) {
      case Direction::LEFT: return '[';
      case Direction::DOWN: return 'W';
      case Direction::RIGHT: return ']';
      case Direction::UP: return 'M';
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
  case Type::NONE:
    return ' ';
  }
}


Board::Board(size_t m, size_t n, size_t nbots) :
    m(m), n(n), nbots(nbots),
    initial_cells(m, n),
    cells(m, n),
    directions(nbots, {m, n}),
    operations(nbots, {m, n}) {}

bool Board::add_input(size_t y, size_t x) {
  if (y >= m || x >= n) {
    error = QCAError::OutOfRange;
    return true;
  }
  inputs.push_back({{y, x}, {}});
  return false;
}

bool Board::add_output(size_t y, size_t x) {
  if (y >= m || x >= n) {
    error = QCAError::OutOfRange;
    return true;
  }
  output_locations.push_back({y, x});
  return false;
}

bool Board::set_input(size_t k, const std::string &bits) {
  if (k > inputs.size()) {
    error = QCAError::OutOfRange;
    return true;
  }
  if (std::any_of(bits.begin(), bits.end(), [](char b){ return (b & '0') != '0'; })) {
    error = QCAError::InvalidInput;
    return true;
  }
  inputs[k].bits.resize(bits.size());
  std::transform(bits.begin(), bits.end(), inputs[k].bits.begin(), [](char b){ return b == '1'; });
  return false;
}

bool Board::set_output(const std::string &colors) {
  if (std::any_of(colors.begin(), colors.end(), [](char c){ return c == Color::INVALID; })) {
    error = QCAError::InvalidInput;
    return true;
  }
  std::copy(colors.begin(), colors.end(), output.begin());
  return false;
}

bool Board::set_cells(const std::string &grid_cells) {
  initial_cells.reset();
  std::stringstream ss(grid_cells);
  std::string line;
  bool invalid = false;
  for (size_t y=0; y<m; ++y) {
    std::getline(ss, line);
    if (line.size() != n) {
      error = QCAError::InvalidInput;
      return true;
    }
    for (size_t x=0; x<n; ++x) {
      char c = line[x];
      // specially set multi-square cells
      switch (c) {
      case '<':
        if (x > 0) Cell::Diode(Direction::LEFT, &initial_cells[y][x], &initial_cells[y][x-1]);
        break;
      case 'v':
        if (y > 0) Cell::Diode(Direction::DOWN, &initial_cells[y][x], &initial_cells[y-1][x]);
        break;
      case '>':
        if (x + 1 < n) Cell::Diode(Direction::RIGHT, &initial_cells[y][x], &initial_cells[y][x+1]);
        break;
      case '^':
        if (y + 1 < m) Cell::Diode(Direction::UP, &initial_cells[y][x], &initial_cells[y+1][x]);
        break;
      case ']':
        if (x + 1 < n) Cell::OffsetCell(true, &initial_cells[y][x], &initial_cells[y][x+1]);
        break;
      case 'W':
        if (y + 1 < m) Cell::OffsetCell(false, &initial_cells[y][x], &initial_cells[y+1][x]);
        break;
      }
      // set 1x1 cells
      if (!initial_cells[y][x].exists) initial_cells[y][x] = Cell(c);
      if (!initial_cells[y][x].exists && c != ' ') invalid = true;
    }
  }
  // check for multi-square consistency
  for (const auto &line : initial_cells) {
    for (const auto &cell : line) {
      if (cell.partner) {
        if (cell.partner->partner != &cell) invalid = true;
      }
    }
  }
  if (ss) invalid = true;
  if (invalid) error = QCAError::InvalidInput;
  return invalid;
}

bool Board::set_instructions(size_t k, const std::string &grid_directions, const std::string &grid_operations) {
  if (k >= nbots) {
    error = QCAError::OutOfRange;
    return true;
  }
  bool invalid = false;
  invalid |= directions[k].reset(grid_directions);
  invalid |= operations[k].reset(grid_operations);
  if (invalid) error = QCAError::InvalidInput;
  return invalid;
}

bool Board::validate(const std::string &grid_fixed) {
  std::stringstream ss(grid_fixed);
  std::string line;
  bool invalid = false;
  // check grids
  for (size_t y=0; y<m; ++y) {
    std::getline(ss, line);
    if (line.size() != n) {
      error = QCAError::InvalidInput;
      return true;
    }
    // validate cells
    for (size_t x=0; x<n; ++x) {
      switch (line[x]) {
      case ' ':
        break;
      case '.':
        if (initial_cells[y][x]) invalid = true;
        break;
      case '<':
        if (x <= 0 || initial_cells[y][x] != initial_cells[y][x-1]) invalid = true;
        break;
      case 'v':
        if (y + 1 >= m || initial_cells[y][x] != initial_cells[y+1][x]) invalid = true;
        break;
      case '>':
        if (x + 1 >= n || initial_cells[y][x] != initial_cells[y][x+1]) invalid = true;
        break;
      case '^':
        if (y <= 0 || initial_cells[y][x] != initial_cells[y-1][x]) invalid = true;
        break;
      default:
        if (initial_cells[y][x] != line[x]) invalid = true;
        break;
      }
      // validate instructions
      if (line[x] != ' ') {
        for (const auto &_directions : directions) if (_directions[y][x]) invalid = true;
        for (const auto &_operations : operations) if (_operations[y][x]) invalid = true;
      }
    }
  }
  // check I/O sequence sizes
  for (const auto &input : inputs) {
    if (input.bits.size() != output.size()) invalid = true;
  }
  if (invalid) error = QCAError::InvalidInput;
  return invalid;
}

} // namespace qca
