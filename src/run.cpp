#include <algorithm>
#include <fstream>
#include <iostream>
#include <string>
#include <sstream>
#include <tuple>

#include "simulate.h"
#include "level.h"
using namespace puzzle;

int main(int argc, char *argv[]) {
  if (argc != 3) {
    std::cerr << "Args: level_file submission_file" << std::endl;
    return 1;
  }
  std::ifstream level_file(argv[1]);
  std::ifstream submission_file(argv[2]);
  // verify(level_file, submission_file, &std::cout);
  verify(level_file, submission_file, &std::cout, false);
}
