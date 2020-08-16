#include <iostream>
#include <sstream>
#include <string>
#include <vector>
#include <utility>

// All interfacing functions return a bool, which is true if there was an error

// Cells:
// x + \ / - | W v x
// ][ >x x<    M x ^

// Resolved cells:
// x + \ / - |, with x and + for unresolved (multi-space cells will each be set)

namespace qca {


class Formatter {
  std::ostringstream ss;
public:
  template<typename T>
  Formatter& operator<<(const T& value) {
    ss << value;
    return *this;
  }
  operator std::string() const { return ss.str(); }
  std::string str() const { return *this; }
};


class QCAError {
  std::string error;
public:
  QCAError() {}
  QCAError(const std::string &error) : error(error) {}
  operator std::string() const { return error; }
  operator bool() const { return !error.empty(); }
  bool operator==(const QCAError &oth) const { return error == oth.error; }
  bool operator!=(const QCAError &oth) const { return !(error == oth.error); }

  static const QCAError OutOfRange;
  static const QCAError InvalidInput;
};


enum class Status {
  INVALID,
  RUNNING,
  DONE,
};


enum class Color_ {
  INVALID,
  BLACK,
  BROWN,
  RED,
  ORANGE,
  YELLOW,
  GREEN,
  BLUE,
  PURPLE,
  // GRAY, // not constructible
  WHITE,
  // non-resistor code colors
  CYAN,
  REDORANGE,
};
class Color {
  Color_ v;
public:
  constexpr Color() : v() {}
  Color(Color_ v) : v(v) {}
  Color(char c);
  operator Color_() const { return v; }
  operator std::string() const;
  friend Color operator+(const Color &lhs, const Color &rhs);
};


enum class Direction_ {
  NONE,
  LEFT,
  DOWN,
  RIGHT,
  UP,
};
class Direction {
  Direction_ v;
public:
  constexpr Direction() : v() {}
  constexpr Direction(Direction_ v) : v(v) {}
  Direction(char c);
  operator Direction_() const { return v; }
  explicit operator bool() const { return v != Direction_::NONE; }
  explicit operator struct Location() const;
  operator std::string() const;
};


struct Location {
  bool valid;
  int y;
  int x;
  constexpr Location() : valid(), y(), x() {}
  constexpr Location(int y, int x) : valid(true), y(y), x(x) {}
  explicit operator bool() const { return valid; }
  Location operator-() const { return *this ? Location(-y, -x) : Location(); }
  Location operator+(const Location &oth) const { return *this && oth ? Location(y + oth.y, x + oth.x) : Location(); }
  Location operator-(const Location &oth) const { return *this + -oth; }
  bool operator==(const Location &oth) const {
    return (!valid && !oth.valid) || (valid == oth.valid && y == oth.y && x == oth.x);
  }
  bool operator!=(const Location &oth) const { return !(*this == oth); }
};


struct Input {
  Location location;
  std::vector<bool> bits;
};

struct Output {
  Location location;
  bool power = true;
  // toggle state to only toggle once when multiple bots hit at once
  bool toggle_power = false;
};


class Cell {
private:
  static Cell _Cell(char c); // dispatcher
public:
  enum class Value {
    UNKNOWN,
    ZERO,
    ONE,
    UNDETERMINED,
  };
  static Cell::Value rotate(const Value &v);
  bool exists;
  bool x; // x or +
  bool latched;
  bool offset;
  // for diodes, direction is the direction of the diode
  // for offset cells, direction is the side from the cell center
  Direction direction;
  Location partner_delta; // dy, dx to partner
  Value value;
  // partial state
  Value previous_value;
  Direction moving;
  bool held;
  bool rotating;
  bool refreshing;


  Cell() {}
  Cell(char c) : Cell(_Cell(c)) {}; // does not account for multisquare cells
  // Producers
  static Cell UnlatchedCell(bool x);
  static Cell LatchedCell(bool x, Value v);
  static Cell OffsetCell(Direction direction);
  static std::pair<Cell, Cell> Diode(Direction direction);

  // Representation
  explicit operator bool() const { return exists; }
  operator char() const;
  char resolved() const;
  operator Color() const;

  // State checkers
  bool is_1x1() const;
  bool is_grabbable() const;
  bool is_latchable() const;
  bool is_refreshable() const;
  bool is_rotateable() const;
};


class Operation {
  struct OperationConstant;
public:
  enum class Type {
    NONE,
    SWAP,
    SYNC,
    BRANCH,
    START,
    ROTATE,
    LATCH,
    REFRESH,
    POWER,
    NEXT,
  };
  Type type;
  uint8_t value;
  Direction direction;

  constexpr Operation() : type(), value(), direction() {}
  Operation(char c) : Operation(Operation_(c)) {}
  explicit operator bool() const { return type != Type::NONE; }
  operator char() const; // not unique if we let branching for all combinations

  // static values
  static const OperationConstant NONE;
  static const OperationConstant GRAB;
  static const OperationConstant DROP;
  static const OperationConstant SWAP;
  static const OperationConstant SYNC;
  static const OperationConstant BRANCH_LEFT_ONE;
  static const OperationConstant BRANCH_DOWN_ONE;
  static const OperationConstant BRANCH_RIGHT_ONE;
  static const OperationConstant BRANCH_UP_ONE;
  static const OperationConstant BRANCH_LEFT_ZERO;
  static const OperationConstant BRANCH_DOWN_ZERO;
  static const OperationConstant BRANCH_RIGHT_ZERO;
  static const OperationConstant BRANCH_UP_ZERO;
  static const OperationConstant START;
  static const OperationConstant ROTATE;
  static const OperationConstant UNLATCH;
  static const OperationConstant LATCH;
  static const OperationConstant TOGGLE_LATCH;
  static const OperationConstant REFRESH;
  static const OperationConstant POWER_A;
  static const OperationConstant POWER_B;
  static const OperationConstant NEXT;
private:
  constexpr Operation(Type type, uint8_t value=0, Direction direction=Direction_::NONE) :
      type(type), value(value), direction(direction) {}
  static constexpr Operation Operation_(char c);
};
struct Operation::OperationConstant {
  char c;
  Operation op;
  template<typename ...Args>
  constexpr OperationConstant(char c, Args &&...type) : c(c), op(std::forward<Args>(type)...) {}
  operator Operation() const { return op; }
};
constexpr Operation::OperationConstant Operation::NONE(' ', Type::NONE);
constexpr Operation::OperationConstant Operation::GRAB('g', Type::SWAP, 0b01);
constexpr Operation::OperationConstant Operation::DROP('d', Type::SWAP, 0b10);
constexpr Operation::OperationConstant Operation::SWAP('w', Type::SWAP, 0b11);
constexpr Operation::OperationConstant Operation::SYNC('s', Type::SYNC);
constexpr Operation::OperationConstant Operation::BRANCH_LEFT_ONE('<', Type::BRANCH, 0b0101, Direction_::LEFT);
constexpr Operation::OperationConstant Operation::BRANCH_DOWN_ONE('v', Type::BRANCH, 0b0101, Direction_::DOWN);
constexpr Operation::OperationConstant Operation::BRANCH_RIGHT_ONE('>', Type::BRANCH, 0b0101, Direction_::RIGHT);
constexpr Operation::OperationConstant Operation::BRANCH_UP_ONE('^', Type::BRANCH, 0b0101, Direction_::UP);
constexpr Operation::OperationConstant Operation::BRANCH_LEFT_ZERO('[', Type::BRANCH, 0b1010, Direction_::LEFT);
constexpr Operation::OperationConstant Operation::BRANCH_DOWN_ZERO('W', Type::BRANCH, 0b1010, Direction_::DOWN);
constexpr Operation::OperationConstant Operation::BRANCH_RIGHT_ZERO(']', Type::BRANCH, 0b1010, Direction_::RIGHT);
constexpr Operation::OperationConstant Operation::BRANCH_UP_ZERO('M', Type::BRANCH, 0b1010, Direction_::UP);
constexpr Operation::OperationConstant Operation::START('S', Type::START);
constexpr Operation::OperationConstant Operation::ROTATE('r', Type::ROTATE);
constexpr Operation::OperationConstant Operation::LATCH('l', Type::LATCH, 0b10);
constexpr Operation::OperationConstant Operation::UNLATCH('u', Type::LATCH, 0b01);
constexpr Operation::OperationConstant Operation::TOGGLE_LATCH('t', Type::LATCH, 0b11);
constexpr Operation::OperationConstant Operation::REFRESH('*', Type::REFRESH);
constexpr Operation::OperationConstant Operation::POWER_A('p', Type::POWER, 0b0);
constexpr Operation::OperationConstant Operation::POWER_B('P', Type::POWER, 0b1);
constexpr Operation::OperationConstant Operation::NEXT('n', Type::NEXT);


struct Bot {
  Location location;
  Direction moving = Direction_::LEFT; // default start going left
  bool holding;
  bool rotating; // ROTATE takes a cycle so needs state
  Bot() {}
  Bot(const Location &location) : location(location) {}
  explicit operator bool() const { return (bool) location; }
};


template<typename T>
class Grid : public std::vector<std::vector<T>> {
  size_t m, n;
public:
  Grid(size_t m, size_t n) : m(m), n(n) {
    this->resize(m);
    for (auto &v : *this) v.resize(n);
  }

  bool valid(const Location &location) const {
    return location && 0 <= location.y && location.y < m && 0 <= location.x && location.x < n;
  }

  typename std::vector<T>::const_reference at(const Location &location) const {
    return this->std::vector<std::vector<T>>::at(location.y).at(location.x);
  }
  typename std::vector<T>::reference at(const Location &location) {
    // const_casting gives an error for the specialized vector<bool>
    return this->std::vector<std::vector<T>>::at(location.y).at(location.x);
  }

  template<typename Q=T>
  typename std::enable_if<std::is_same<Q, Cell>::value, const T*>::type partner(const Location &location) const {
    const T& cell = this->at(location);
    if (cell.partner_delta) {
      Location partner_location = location + cell.partner_delta;
      if (this->valid(partner_location)) return &this->at(partner_location);
    }
    return nullptr;
  }
  template<typename Q=T>
  typename std::enable_if<std::is_same<Q, Cell>::value, T*>::type partner(const Location &location) {
    return const_cast<T*>(std::as_const(*this).partner(location));
  }

  void reset() { reset(T()); }
  bool reset(const T &v) {
    for (auto &line : *this) {
      std::fill(line.begin(), line.end(), v);
    }
  }
  // return true if input error
  bool reset(const std::string &grid) {
    std::stringstream ss(grid);
    std::string line;
    for (size_t y=0; y<m; ++y) {
      std::getline(ss, line);
      if (line.size() != n) return true;
      for (size_t x=0; x<n; ++x) (*this)[y][x] = line[x];
    }
    if (ss) return true;
    return false;
  }

  friend std::ostream& operator<<(std::ostream &os, const Grid &grid) {
    for (const auto &line : grid) {
      for (const auto &square : line) {
        os << square;
      }
      os << std::endl;
    }
  }
};


class Board {
  // setup
  const size_t m, n, nbots;
  Grid<Cell> initial_cells;
  Grid<bool> trespassable;
  std::vector<Grid<Direction>> directions; // bot -> grid
  std::vector<Grid<Operation>> operations; // bot -> grid
  std::vector<Bot> bots;
  std::vector<Input> inputs;
  std::vector<Output> outputs;
  std::vector<Color> output_colors;
  // error
  QCAError error;
  // runtime
  Grid<Cell> cells;
  Status status;
  size_t step; // step index for I/O
public:
  // Setup
  Board(size_t m, size_t n, size_t nbots);
  // add input cell square
  bool add_input(size_t y, size_t x);
  // add output cell square
  bool add_output(size_t y, size_t x);
  // set input bit sequence for input k
  bool set_input(size_t k, const std::string &bits);
  // set output color sequence
  bool set_output_colors(const std::string &colors);
  // set initial cell layout
  bool set_cells(const std::string &grid_cells);
  // set instructions for bot k
  bool set_instructions(
      size_t k, const std::string &grid_directions, const std::string &grid_operations);

  // Runtime
  // check if setup is valid
  // ' ' for any, '.' for nothing, < v > ^ for equal to another, x+/\-| for cell
  bool reset_and_validate(const std::string &grid_fixed);
  // resolve the board
  bool resolve();
  // step forward one cycle
  bool move();
  // run through verification and return true if finishes
  std::pair<bool, bool> run(size_t max_cycles);

  // Output
  // read value of last error
  std::pair<std::string, bool> get_error();
  // check status
  std::pair<Status, bool> get_status();
  // return the most recent board
  std::pair<std::string, bool> get_unresolved_board();
  std::pair<std::string, bool> get_resolved_board();
  std::pair<std::vector<Bot>, bool> get_bots();
};


} // namespace qca
