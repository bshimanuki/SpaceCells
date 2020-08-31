#include "emscripten/bind.h"

#include "level.h"
#include "simulate.h"

using namespace emscripten;
using namespace puzzle;

EMSCRIPTEN_BINDINGS(puzzle_bindings) {
  class_<Board>("Board")
    .constructor<size_t, size_t, size_t>()
    .property("m", &Board::get_m)
    .property("n", &Board::get_n)
    .function("get_bots", &Board::get_bots)
    .function("get_inputs", &Board::get_inputs)
    .function("get_outputs", &Board::get_outputs)
    .function("get_output_colors", &Board::get_output_colors)
    .function("get_trespassable", &Board::get_trespassable)
    .function("get_level", &Board::get_level)
    .property("step", &Board::get_step)
    .property("cycle", &Board::get_cycle)
    .function("get_cells", &Board::get_cells)
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
    ;
  function("LoadBoard", static_cast<Board(*)(const std::string&, const std::string&)>(&load));

  value_object<Bot>("Bot")
    .field("location", &Bot::location)
    .field("moving", &Bot::moving)
    .field("holding", &Bot::holding)
    .field("rotating", &Bot::rotating)
    ;

  class_<Color>("Color")
    .constructor<char>()
    .property("as_char", &Color::operator char)
    ;

  value_object<Location>("Location")
    .field("valid", &Location::valid)
    .field("y", &Location::y)
    .field("x", &Location::x)
    ;

  class_<Direction>("Direction")
    .constructor<char>()
    .property("as_char", &Direction::operator char)
    ;

  enum_<Status>("Status")
    .value("INVALID", Status::INVALID)
    .value("RUNNING", Status::RUNNING)
    .value("DONE", Status::DONE)
    ;

  class_<Input>("Input")
    .property("location", &Input::location)
    .function("get_bit", +[](const Input &input, size_t k){ return static_cast<bool>(input.bits[k]); })
    .function("size", +[](const Input &input){ return input.bits.size(); })
    ;

  class_<Output>("Output")
    .property("location", &Output::location)
    .property("power", &Output::power)
    ;

  class_<Cell>("Cell")
    .constructor<>()
    .constructor<char>()
    .property("exists", &Cell::exists)
    .property("x", &Cell::x)
    .property("latched", &Cell::latched)
    .property("offset", &Cell::offset)
    .property("direction", &Cell::direction)
    .property("partner_delta", &Cell::partner_delta)
    .property("value", +[](const Cell &cell){ return static_cast<char>(cell.value); })
    .property("previous_value", +[](const Cell &cell){ return static_cast<char>(cell.previous_value); })
    .property("moving", &Cell::moving)
    .property("held", &Cell::held)
    .property("rotating", &Cell::rotating)
    .property("refreshing", &Cell::refreshing)
    .function("resolved", &Cell::resolved)
    .function("unresolved", &Cell::operator char)
    .property("color", &Cell::operator Color)
    ;

  class_<Operation>("Operation")
    .constructor<char>()
    .property("exists", &Operation::operator bool)
    .property("direction", &Operation::direction)
    .property("as_char", &Operation::operator char)
    ;

  value_array<std::pair<bool, bool>>("PairValidErr")
    .element(&std::pair<bool, bool>::first)
    .element(&std::pair<bool, bool>::second)
    ;

  class_<Grid<Cell>>("Grid<Cell>")
    .function("at", static_cast<Cell&(Grid<Cell>::*)(size_t, size_t)>(&Grid<Cell>::at))
    ;

  class_<Grid<bool>>("Grid<bool>")
    .function("at", static_cast<bool&(Grid<bool>::*)(size_t, size_t)>(&Grid<bool>::at))
    ;

  class_<Grid<char>>("Grid<char>")
    .function("at", static_cast<char&(Grid<char>::*)(size_t, size_t)>(&Grid<char>::at))
    ;

  register_vector<Bot>("vector<Bot>");
  register_vector<Input>("vector<Input>");
  register_vector<Output>("vector<Output>");
  register_vector<Color>("vector<Color>");
}
