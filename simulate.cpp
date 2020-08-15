#include "simulate.h"

#include <algorithm>
#include <iostream>
#include <sstream>
#include <string>
#include <tuple>
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
  case ']':
    return OffsetCell(Direction::LEFT);
  case '[':
    return OffsetCell(Direction::RIGHT);
  case 'W':
    return OffsetCell(Direction::UP);
  case 'M':
    return OffsetCell(Direction::DOWN);
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

Cell Cell::OffsetCell(Direction direction) {
  Cell c = UnlatchedCell(true);
  c.offset = true;
  c.direction = direction;
  switch (direction) {
  case Direction::LEFT: c.partner_delta = {0, -1}; break;
  case Direction::DOWN: c.partner_delta = {1, 0}; break;
  case Direction::RIGHT: c.partner_delta = {0, 1}; break;
  case Direction::UP: c.partner_delta = {-1, 0}; break;
  default: break;
  }
  return c;
}

std::pair<Cell, Cell> Cell::Diode(Direction direction) {
  Cell src = UnlatchedCell(true);
  Cell dest = LatchedCell(true, Value::UNKNOWN);
  src.direction = direction;
  dest.direction = direction;
  switch (direction) {
  case Direction::LEFT:
    src.partner_delta = {0, -1};
    dest.partner_delta = {0, 1};
    break;
  case Direction::DOWN:
    src.partner_delta = {1, 0};
    dest.partner_delta = {-1, 0};
    break;
  case Direction::RIGHT:
    src.partner_delta = {0, 1};
    dest.partner_delta = {0, -1};
    break;
  case Direction::UP:
    src.partner_delta = {-1, 0};
    dest.partner_delta = {1, 0};
    break;
  default: break;
  }
  return {src, dest};
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
    directions(nbots, {m, n}),
    operations(nbots, {m, n}),
    bots(nbots),
    cells(m, n) {}

bool Board::add_input(size_t y, size_t x) {
  if (y >= m || x >= n) {
    error = QCAError::OutOfRange;
    return true;
  }
  inputs.push_back({Location(y, x), {}});
  return false;
}

bool Board::add_output(size_t y, size_t x) {
  if (y >= m || x >= n) {
    error = QCAError::OutOfRange;
    return true;
  }
  output_locations.push_back(Location(y, x));
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
        if (x > 0) std::tie(initial_cells[y][x], initial_cells[y][x-1]) = Cell::Diode(Direction::LEFT);
        break;
      case 'v':
        if (y > 0) std::tie(initial_cells[y][x], initial_cells[y+1][x]) = Cell::Diode(Direction::DOWN);
        break;
      case '>':
        if (x + 1 < n) std::tie(initial_cells[y][x], initial_cells[y][x+1]) = Cell::Diode(Direction::RIGHT);
        break;
      case '^':
        if (y + 1 < m) std::tie(initial_cells[y][x], initial_cells[y-1][x]) = Cell::Diode(Direction::UP);
        break;
      }
      // set 1x1 cells
      if (!initial_cells[y][x].exists) initial_cells[y][x] = Cell(c);
      if (!initial_cells[y][x].exists && c != ' ') return error = QCAError::InvalidInput;
    }
  }
  // check for multi-square consistency
  for (size_t y=0; y<m; ++y) {
    for (size_t x=0; x<n; ++x) {
      if (initial_cells[y][x].partner_delta) {
        const Cell* partner = initial_cells.partner(Location(y, x));
        if (!partner || initial_cells[y][x].partner_delta != -partner->partner_delta) {
          return error = QCAError::InvalidInput;
        }
      }
    }
  }
  if (ss) return error = QCAError::InvalidInput;
  return false;
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

bool Board::reset_and_validate(const std::string &grid_fixed) {
  std::stringstream ss(grid_fixed);
  std::string line;
  bool invalid = false;
  for (auto &bot : bots) bot = Bot();
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
        Location location(y, x);
        const Cell &cell = initial_cells[y][x];
        const Cell *partner = initial_cells.partner(location);
        switch (cell) {
        case '<':
        case 'v':
        case '>':
        case '^':
          if (!partner || *partner != 'x') invalid = true;
          if (!partner || cell.partner_delta != -partner->partner_delta) invalid = true;
          if (!partner || cell.direction != partner->direction) invalid = true;
          break;
        case '[':
          if (!partner || cell.partner_delta != -partner->partner_delta) invalid = true;
          if (!partner || *partner != ']') invalid = true;
          break;
        case ']':
          if (!partner || cell.partner_delta != -partner->partner_delta) invalid = true;
          if (!partner || *partner != '[') invalid = true;
          break;
        case 'W':
          if (!partner || cell.partner_delta != -partner->partner_delta) invalid = true;
          if (!partner || *partner != 'M') invalid = true;
          break;
        case 'M':
          if (!partner || cell.partner_delta != -partner->partner_delta) invalid = true;
          if (!partner || *partner != 'W') invalid = true;
          break;
        default:
          break;
        }
        break;
      }
      // validate instructions
      if (line[x] != ' ') {
        for (const auto &_directions : directions) if (_directions[y][x]) invalid = true;
        for (const auto &_operations : operations) if (_operations[y][x]) invalid = true;
      }
      // check bot start locations
      for (size_t k=0; k<nbots; ++k) {
        if (operations[k][y][x].type == Operation::Type::START) {
          if (bots[k]) {
            error = QCAError("Bot has multiple START instructions");
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
      error = QCAError("Bot does not have a START instruction");
      return true;
    }
  }
  // check I/O sequence sizes
  for (const auto &input : inputs) {
    if (input.bits.size() != output.size()) invalid = true;
  }
  // reset state
  cells = initial_cells;
  step = 0;
  status = Status::RUNNING;
  if (invalid) error = QCAError::InvalidInput;
  return invalid;
}

std::pair<std::string, bool> Board::get_error() {
  return {error, false};
}

std::pair<Status, bool> Board::get_status() {
  return {status, false};
}

std::pair<std::string, bool> Board::get_unresolved_board() {
  std::stringstream ss;
  for (const auto &line : cells) {
    for (const auto &square : line) {
      ss << square;
    }
    ss << std::endl;
  }
  return {ss.str(), false};
}

std::pair<std::string, bool> Board::get_resolved_board() {
  std::stringstream ss;
  for (const auto &line : cells) {
    for (const auto &square : line) {
      ss << square.resolved();
    }
    ss << std::endl;
  }
  return {ss.str(), false};
}

std::pair<std::vector<Bot>, bool> Board::get_bots() {
  return {bots, false};
}

} // namespace qca
