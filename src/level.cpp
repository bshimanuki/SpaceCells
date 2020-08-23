#include "level.h"

#include <algorithm>
#include <iostream>
#include <string>
#include <sstream>

#include "simulate.h"

namespace puzzle {

std::string get_grid(std::istream &is, int m) {
  std::stringstream ss;
  std::string line;
  // ignore leading blank lines
  while (is.peek() == '\n') is.get();
  for (int i=0; i<m; ++i) {
    getline(is, line);
    // treat '_' as an alternative to ' '
    std::replace(line.begin(), line.end(), '_', ' ');
    ss << line << std::endl;
  }
  return ss.str();
}

bool show(std::ostream *os, const std::string &line) {
  if (os) *os << line << std::endl;
  return false;
}

bool verify(std::istream &is_level, std::istream &is_submission, std::ostream *os, bool print_board) {
  std::string line;
  // Level
  int m, n, b, ni, no;
  is_level >> m >> n >> b >> ni >> no;
  std::getline(is_level, line);
  std::string level = get_grid(is_level, m);
  Board board(m, n, b);
  int y, x;
  for (int k=0; k<ni; ++k) {
    is_level >> y >> x;
    if (board.add_input(y, x)) return show(os, board.get_error());
  }
  for (int k=0; k<no; ++k) {
    is_level >> y >> x;
    if (board.add_output(y, x)) return show(os, board.get_error());
  }
  // I/O
  for (int k=0; k<ni; ++k) {
    is_level >> line;
    if (board.set_input(k, line)) return show(os, board.get_error());
  }
  is_level >> line;
  if (board.set_output_colors(line)) return show(os, board.get_error());
  // Submission
  std::string cells = get_grid(is_submission, m);
  if (board.set_cells(cells)) return show(os, board.get_error());
  for (int k=0; k<b; ++k) {
    std::string directions = get_grid(is_submission, m);
    std::string operations = get_grid(is_submission, m);
    if (board.set_instructions(k, directions, operations)) return show(os, board.get_error());
  }
  if (board.reset_and_validate(level)) return show(os, board.get_error());
  constexpr int MAX_CYCLES = 999;
  // constexpr int MAX_CYCLES = 2;
  auto [passes, err] = board.run(MAX_CYCLES, print_board ? os : nullptr);
  if (err) return show(os, board.get_error());
  if (os) {
    if (passes) *os << "Passed!" << std::endl;
    else *os << "Failed: " << board.get_error() << std::endl;
  }
  return passes;
}

} // namespace puzzle
