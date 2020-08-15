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


enum Status {
  INVALID,
  RUNNING,
  DONE,
};


class Color {
public:
  enum ColorEnum {
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
  Color() {}
  Color(ColorEnum v) : v(v) {}
  Color(char c);
  operator ColorEnum() const { return v; }
  operator std::string() const;
  Color operator+(const Color &oth) const;
private:
  ColorEnum v;
};


class Direction {
public:
  enum DirectionEnum {
    NONE,
    LEFT,
    DOWN,
    RIGHT,
    UP,
  };
  Direction() {}
  Direction(DirectionEnum v) : v(v) {}
  Direction(char c);
  operator DirectionEnum() const { return v; }
  explicit operator bool() const { return v != NONE; }
  operator std::string() const;
private:
  DirectionEnum v;
};


struct Location {
  bool valid;
  int y;
  int x;
  Location() {}
  Location(int y, int x) : valid(true), y(y), x(x) {}
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
  bool exists;
  bool x; // x or +
  bool latched;
  bool offset;
  // for diodes, direction is the direction of the diode
  // for offset cells, direction is the side from the cell center
  Direction direction;
  Location partner_delta; // dy, dx to partner
  Value value;
  Value previous_value;

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
};


struct Operation {
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
  Direction direction;
  uint8_t value;

  Operation() {}
  Operation(char c);
  explicit operator bool() const { return type != Type::NONE; }
  operator char() const; // not unique if we let branching for all combinations
};


struct Bot {
  Location location;
  Direction direction = Direction::LEFT; // default start going left
  bool holding;
  bool rotated; // ROTATE takes a cycle so needs state
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

  const T& at(const Location &location) const {
    return this->at(location.y).at(location.x);
  }
  T& at(const Location &location) {
    return const_cast<T&>(std::as_const(*this).at(location));
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

  void reset() {
    for (auto &line : *this) {
      for (auto &square : line) {
        square = T();
      }
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
  std::vector<Grid<Direction>> directions; // bot -> grid
  std::vector<Grid<Operation>> operations; // bot -> grid
  std::vector<Bot> bots;
  std::vector<Input> inputs;
  std::vector<Location> output_locations;
  std::vector<Color> output;
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
  bool set_output(const std::string &colors);
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
