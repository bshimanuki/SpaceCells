#include <algorithm>
#include <fstream>
#include <iostream>
#include <string>
#include <sstream>
#include <tuple>

#include "simulate.h"
using namespace puzzle;

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

int show(const std::string &line) {
  std::cout << line << std::endl;
  return 0;
}

int main(int argc, char *argv[]) {
  if (argc != 3) {
    std::cerr << "Args: level_file submission_file" << std::endl;
    return 1;
  }
  std::ifstream level_file(argv[1]);
  std::ifstream submission_file(argv[2]);
  std::string line;
  // Level
  int m, n, b, ni, no;
  level_file >> m >> n >> b >> ni >> no;
  std::getline(level_file, line);
  std::string level = get_grid(level_file, m);
  Board board(m, n, b);
  int y, x;
  for (int k=0; k<ni; ++k) {
    level_file >> y >> x;
    if (board.add_input(y, x)) return show(board.get_error());
  }
  for (int k=0; k<no; ++k) {
    level_file >> y >> x;
    if (board.add_output(y, x)) return show(board.get_error());
  }
  // I/O
  for (int k=0; k<ni; ++k) {
    level_file >> line;
    if (board.set_input(k, line)) return show(board.get_error());
  }
  level_file >> line;
  if (board.set_output_colors(line)) return show(board.get_error());
  // Submission
  std::string cells = get_grid(submission_file, m);
  if (board.set_cells(cells)) return show(board.get_error());
  for (int k=0; k<b; ++k) {
    std::string directions = get_grid(submission_file, m);
    std::string operations = get_grid(submission_file, m);
    if (board.set_instructions(k, directions, operations)) return show(board.get_error());
  }
  if (board.reset_and_validate(level)) return show(board.get_error());
  // constexpr int MAX_CYCLES = 999;
  constexpr int MAX_CYCLES = 8;
  auto [passes, err] = board.run(MAX_CYCLES, true);
  if (err) return show(board.get_error());
  if (passes) std::cout << "Passed!" << std::endl;
  else std::cout << "Failed:" << board.get_error() << std::endl;
}
