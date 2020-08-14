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


enum Status {
  INVALID,
  VALID,
  DONE,
};


enum class Color {
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


struct Direction {
  enum {
    NONE,
    LEFT,
    DOWN,
    RIGHT,
    UP,
  } v;
  operator char() const;
};


struct Location {
  size_t y;
  size_t x;
};


template<typename T>
class Grid : std::vector<std::vector<T>> {
  size_t m, n;
public:
  Grid(size_t m, size_t n) : m(m), n(n) {
    this->resize(m);
    for (auto &v : *this) v.resize(n);
  }
  const T& at(const Location &location) const {
    return this->at(location.y).at(location.x);
  }
  T& at(const Location &location) {
    return const_cast<T&>(std::as_const(*this).at(location));
  }
  friend std::ostream& operator<<(std::ostream &os, const Grid &grid);
};


struct Input {
  Location location;
  std::vector<bool> bits;
};


struct Cell {
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
  Cell *partner;
  Value value;
  Value previous_value;

  // Representation
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
  uint8_t value;
  operator char() const; // not unique
};


class Board {
  size_t m, n, nbots;
  Grid<Cell> initial_cells;
  Grid<Cell> cells;
  std::vector<Grid<Direction>> directions; // bot -> grid
  std::vector<Grid<Operation>> operations; // bot -> grid
  std::vector<Input> inputs;
  std::vector<Color> output;
  std::string error;
public:
  // Setup
  Board(size_t m, size_t n, size_t nbots);
  // add input cell space
  bool add_input(size_t y, size_t x);
  // add output cell space
  bool add_output(size_t y, size_t x);
  // set input sequence for input k
  bool set_input(size_t k, const std::string &bits);
  // set output sequence
  bool set_output(const std::string &colors);
  // set initial cell layout
  bool set_cells(const std::string &grid_cells);
  // set instructions for bot k
  bool set_instructions(
      size_t k, const std::string &grid_directions, const std::string &grid_operations);
  // check if setup is valid
  // ' ' for any, '.' for nothing, < v > ^ for equal to another, x+/\-| for cell
  bool validate(const std::string &grid_fixed);

  // Runtime
  // read value of last error
  std::pair<std::string, bool> get_error();
  // return the resolved board
  std::pair<std::string, bool> resolve();
  // step forward one cycle
  bool step();
  // reset to t=0
  bool reset();
  // check status
  std::pair<Status, bool> status();
  // run through verification and return true if finishes
  std::pair<bool, bool> run(size_t max_cycles);
};


} // namespace qca
