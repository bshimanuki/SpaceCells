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

Color::operator std::string() const {
  switch (*this) {
  case Color_::BLACK: return "K";
  case Color_::BROWN: return "N";
  case Color_::RED: return "R";
  case Color_::ORANGE: return "O";
  case Color_::YELLOW: return "Y";
  case Color_::GREEN: return "G";
  case Color_::BLUE: return "B";
  case Color_::PURPLE: return "P";
  case Color_::WHITE: return "W";
  case Color_::CYAN: return "C";
  case Color_::REDORANGE: return "E";
  case Color_::INVALID: default: return "#";
  }
}

Color operator+(const Color &lhs, const Color &rhs) {
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
  return Color_::INVALID;
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

Direction::operator std::string() const {
  switch (*this) {
  case Direction_::NONE:
    return " ";
  case Direction_::LEFT:
    return "]";
  case Direction_::DOWN:
    return "M";
  case Direction_::RIGHT:
    return "[";
  case Direction_::UP:
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
  case Direction_::LEFT: c.partner_delta = {0, -1}; break;
  case Direction_::DOWN: c.partner_delta = {1, 0}; break;
  case Direction_::RIGHT: c.partner_delta = {0, 1}; break;
  case Direction_::UP: c.partner_delta = {-1, 0}; break;
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
  if (!this->exists) return ' ';
  // offset cells
  if (this->offset) {
    switch (this->direction) {
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
  switch (this->direction) {
  case Direction_::NONE:
    break;
  case Direction_::LEFT:
    return this->latched ? 'x' : '<';
  case Direction_::DOWN:
    return this->latched ? 'x' : 'v';
  case Direction_::RIGHT:
    return this->latched ? 'x' : '>';
  case Direction_::UP:
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
    case Value::ONE: return Color_::BLUE;
    case Value::ZERO: return Color_::GREEN;
    default: return Color_::INVALID;
    }
  case '+':
    switch (value) {
    case Value::ONE: return Color_::RED;
    case Value::ZERO: return Color_::ORANGE;
    default: return Color_::INVALID;
    }
  case ' ':
    return Color_::BLACK;
  default:
    return Color_::INVALID;
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
    type = Type::BRANCH; direction = Direction_::LEFT; value = 0b0101; break;
  case 'v': // BRANCH v /-
    type = Type::BRANCH; direction = Direction_::DOWN; value = 0b0101; break;
  case '>': // BRANCH > /-
    type = Type::BRANCH; direction = Direction_::RIGHT; value = 0b0101; break;
  case '^': // BRANCH ^ /-
    type = Type::BRANCH; direction = Direction_::UP; value = 0b0101; break;
  case '[': // BRANCH < \|
    type = Type::BRANCH; direction = Direction_::LEFT; value = 0b1010; break;
  case 'W': // BRANCH v \|
    type = Type::BRANCH; direction = Direction_::DOWN; value = 0b1010; break;
  case ']': // BRANCH > \|
    type = Type::BRANCH; direction = Direction_::RIGHT; value = 0b1010; break;
  case 'M': // BRANCH ^ \|
    type = Type::BRANCH; direction = Direction_::UP; value = 0b1010; break;
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
  case Type::NONE:
    return ' ';
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
  outputs.push_back({Location(y, x)});
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

bool Board::set_output_colors(const std::string &colors) {
  if (std::any_of(colors.begin(), colors.end(), [](char c){ return Color(c) == Color(Color_::INVALID); })) {
    error = QCAError::InvalidInput;
    return true;
  }
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
      error = QCAError::InvalidInput;
      return true;
    }
    for (size_t x=0; x<n; ++x) {
      char c = line[x];
      // specially set multi-square cells
      switch (c) {
      case '<':
        if (x > 0) std::tie(initial_cells[y][x], initial_cells[y][x-1]) = Cell::Diode(Direction_::LEFT);
        break;
      case 'v':
        if (y > 0) std::tie(initial_cells[y][x], initial_cells[y+1][x]) = Cell::Diode(Direction_::DOWN);
        break;
      case '>':
        if (x + 1 < n) std::tie(initial_cells[y][x], initial_cells[y][x+1]) = Cell::Diode(Direction_::RIGHT);
        break;
      case '^':
        if (y + 1 < m) std::tie(initial_cells[y][x], initial_cells[y-1][x]) = Cell::Diode(Direction_::UP);
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
  trespassable.reset(true);
  for (auto &_output : outputs) {
    trespassable.at(_output.location) = false;
    _output.power = true;
  }
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
      // set non trespassable
      switch (line[x]) {
      case ' ': break;
      default: trespassable[y][x] = false; break;
      }
      // validate instructions
      if (!trespassable[y][x]) {
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
  for (const Input &input : inputs) {
    if (input.bits.size() != output_colors.size()) invalid = true;
  }
  // reset state
  cells = initial_cells;
  step = 0;
  for (Input &input : inputs) {
    Cell &input_cell = cells.at(input.location);
    if (input_cell != 'x' && input_cell != '+') invalid = true;
    input_cell.latched = true;
    if (!input.bits.empty()) {
      input_cell.value = input.bits[0] ? Cell::Value::ONE : Cell::Value::ZERO;
    }
  }
  status = output_colors.empty() ? Status::DONE : Status::RUNNING;
  if (invalid) return error = QCAError::InvalidInput;
  if (resolve()) return true;
  return false;
}

bool Board::move() {
  if (status != Status::RUNNING) return false;
  bool next = false;
  for (auto &bot : bots) {
     // TODO
  }
  if (resolve()) return true;
  if (next) {
    Color color = Color_::BLACK;
    for (const auto& _output : outputs) {
      color = color + cells.at(_output.location);
    }
    if (color != output_colors[step]) {
      return error = QCAError("Wrong output");
    }
    ++step;
  }
  return false;
}

std::pair<bool, bool> Board::run(size_t max_cycles) {
  // make sure it starts resolved
  if (resolve()) return {false, true};
  for (size_t cycle=0; cycle<max_cycles; ++cycle) {
    if (move()) return {false, true};
    switch (status) {
    case Status::INVALID:
      return {false, false};
    case Status::RUNNING:
      break;
    case Status::DONE:
      return {true, false};
    }
  }
  return {false, false};
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
