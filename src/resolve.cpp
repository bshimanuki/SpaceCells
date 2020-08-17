#include <fstream>
#include <iostream>
#include <string>
#include <sstream>

#include "simulate.h"
using namespace puzzle;

std::string get_grid(std::istream &is, int m) {
  std::stringstream ss;
  std::string line;
  for (int i=0; i<m; ++i) {
    getline(is, line);
    ss << line << std::endl;
  }
  return ss.str();
}

int main(int argc, char *argv[]) {
  if (argc != 2) {
    std::cerr << "Args: level_file submission_file" << std::endl;
    return 1;
  }
  std::ifstream level_file(argv[0]);
  std::ifstream submission_file(argv[1]);
  // Level
  int m, n, b, ni, no;
  level_file >> m >> n >> b >> ni >> no;
  std::string level = get_grid(level_file, m);
  Board board(m, n, b);
  int y, x;
  for (int k=0; k<ni; ++k) {
    level_file >> y >> x;
    board.add_input(y, x);
  }
  for (int k=0; k<no; ++k) {
    level_file >> y >> x;
    board.add_output(y, x);
  }
  // I/O
  std::string line;
  for (int k=0; k<ni; ++k) {
    level_file >> line;
    board.set_input(k, line);
  }
  level_file >> line;
  board.set_output_colors(line);
  // Submission
  std::string cells = get_grid(submission_file, m);
  board.set_cells(cells);
  for (int k=0; k<b; ++k) {
    std::string directions = get_grid(submission_file, m);
    std::string operations = get_grid(submission_file, m);
    board.set_instructions(k, directions, operations);
  }
  board.reset_and_validate(level);
}
