#include "emscripten/bind.h"

#include "level.h"
#include "simulate.h"

using namespace puzzle;
using namespace emscripten;

EMSCRIPTEN_BINDINGS(board_binding) {
  class_<Board>("Board")
    .constructor<size_t, size_t, size_t>()
    .function("add_input", &Board::add_input)
    .function("add_output", &Board::add_output)
    .function("set_input", &Board::set_input)
    .function("set_output_colors", &Board::set_output_colors)
    .function("set_cells", &Board::set_cells)
    .function("set_instructions", &Board::set_instructions)
    .function("reset_and_validate", &Board::reset_and_validate)
    .function("resolve", &Board::resolve)
    .function("move", &Board::move)
    .function("run", static_cast<std::pair<bool,bool>(Board::*)(size_t)>(&Board::run))
    .function("check_status", &Board::check_status)
    .function("get_error", &Board::get_error)
    .function("get_unresolved_board", &Board::get_unresolved_board)
    .function("get_resolved_board", &Board::get_resolved_board)
    .function("get_bots", &Board::get_bots)
    ;
  function("LoadBoard", static_cast<std::pair<Board,bool>(*)(const std::string&, const std::string&)>(&load));

  class_<Bot>("Bot")
    .constructor<>()
    .property("location", &Bot::location)
    .property("moving", &Bot::moving)
    .property("holding", &Bot::holding)
    .property("rotating", &Bot::rotating)
    ;

  class_<Location>("Location")
    .constructor<>()
    .constructor<int, int>()
    .constructor<Direction>()
    .property("valid", &Location::valid)
    .property("y", &Location::y)
    .property("x", &Location::x)
    ;

  class_<Direction>("Direction")
    .constructor<>()
    ;
}
