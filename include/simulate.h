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

namespace puzzle {


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


class Error {
  std::string error;
public:
  Error() {}
  Error(const std::string &error) : error(error) {}
  operator std::string() const { return error; }
  operator bool() const { return !error.empty(); }
  bool operator==(const Error &oth) const { return error == oth.error; }
  bool operator!=(const Error &oth) const { return !(error == oth.error); }

  // TODO: remove
  Error& operator=(const Error &error) { this->error = error.error;  throw std::runtime_error(this->error); }

  static const Error OutOfRange;
  static const Error InvalidInput;
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
  bool valid = false;
  int y = 0;
  int x = 0;
  constexpr Location() {}
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
public:
  enum class Value_ {
    UNKNOWN,
    ZERO,
    ONE,
    UNDEFINED,
  };

  class Value {
    Value_ v;
  public:
    constexpr Value() : v() {}
    constexpr Value(Value_ v) : v(v) {}
    explicit Value(char c);
    operator Value_() const { return v; }
    explicit operator bool() const { return v != Value_::UNKNOWN; }
    operator std::string() const;
    Value operator-() const;
    Value& operator+=(const Value &rhs) { return *this = *this + rhs; }
    friend Value operator+(const Value &lhs, const Value &rhs);
  };

  bool exists = false;
  bool x = false; // x or +
  bool latched = false;
  bool offset = false;
  // for diodes, direction is the direction of the diode
  // for offset cells, direction is the side from the cell center
  Direction direction;
  Location partner_delta; // dy, dx to partner
  Value value;
  // partial state
  Value previous_value;
  Direction moving;
  bool held = false;
  bool rotating = false;
  bool refreshing = false;

  constexpr Cell() {}
  Cell(char c) : Cell(_Cell(c)) {}; // does not account for diode cells
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
  bool is_diode() const;

private:
  static Cell _Cell(char c); // dispatcher
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
  uint8_t value = 0;
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
  static Operation Operation_(char c); // dispatcher
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
    return location && 0 <= location.y && location.y < (int) m && 0 <= location.x && location.x < (int) n;
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

  bool reset() { return reset(T()); }
  bool reset(const T &v) {
    for (auto &line : *this) {
      std::fill(line.begin(), line.end(), v);
    }
    return false;
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
    if (ss.peek() != EOF) return true;
    return false;
  }

  // convert Location to size_t (1-indexed because NONE maps to 0)
  size_t flat_index(const Location &location) const {
    if (!valid(location)) return 0;
    return location.y * n + location.x + 1;
  }

  size_t max_flat_index() const {
    return m * n + 1;
  }

  friend std::ostream& operator<<(std::ostream &os, const Grid &grid) {
    for (const auto &line : grid) {
      for (const auto &square : line) {
        os << square;
      }
      os << std::endl;
    }
    return os;
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
  Error error;
  // runtime
  Grid<Cell> cells;
  Status status;
  size_t step = 0; // step index for I/O
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
  std::string get_error();
  // check status
  std::pair<Status, bool> get_status();
  // return the most recent board
  std::pair<std::string, bool> get_unresolved_board();
  std::pair<std::string, bool> get_resolved_board();
  std::pair<std::vector<Bot>, bool> get_bots();
};


} // namespace puzzle
