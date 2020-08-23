#ifndef LEVEL_H_
#define LEVLE_H_

#include <algorithm>
#include <iostream>
#include <string>
#include <sstream>

#include "simulate.h"

namespace puzzle {

// parse grid
std::string get_grid(std::istream &is, int m);
// print line
bool show(std::ostream *os, const std::string &line);
// verify from level file and submission file
bool verify(std::istream &is_level, std::istream &is_submission, std::ostream *os, bool print_board=true);

} // namespace puzzle
#endif // LEVEL_H_
