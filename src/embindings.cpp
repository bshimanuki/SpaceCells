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
    .function("get_input_bits", &Board::get_input_bits)
    .function("get_output_colors", &Board::get_output_colors)
    .function("get_trespassable", &Board::get_trespassable)
    .function("get_level", &Board::get_level)
    .function("get_last_color", &Board::get_last_color)
    .property("was_next", &Board::get_was_next)
    .property("test_case", &Board::get_test_case)
    .property("step", &Board::get_step)
    .property("cycle", &Board::get_cycle)
    .function("get_cells", &Board::get_cells)
    .function("add_input", &Board::add_input)
    .function("add_output", &Board::add_output)
    .function("set_input_bits", &Board::set_input_bits)
    .function("set_output_colors", &Board::set_output_colors)
    .function("set_cells", &Board::set_cells)
    .function("set_instructions", &Board::set_instructions)
    .function("reset_and_validate", static_cast<bool(Board::*)(void)>(&Board::reset_and_validate))
    .function("resolve", &Board::resolve)
    .function("move", &Board::move)
    .function("run", static_cast<std::pair<bool,bool>(Board::*)(size_t)>(&Board::run))
    .function("check_status", &Board::check_status)
    .function("get_error", &Board::get_error)
    .function("get_error_reason", &Board::get_error_reason)
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

  enum_<ErrorReason>("ErrorReason")
    .value("NONE", ErrorReason::NONE)
    .value("INVALID_LEVEL", ErrorReason::INVALID_LEVEL)
    .value("INVALID_INPUT", ErrorReason::INVALID_INPUT)
    .value("RUNTIME_ERROR", ErrorReason::RUNTIME_ERROR)
    .value("WRONG_OUTPUT", ErrorReason::WRONG_OUTPUT)
    .value("TOO_MANY_CYCLES", ErrorReason::TOO_MANY_CYCLES)
    ;

  value_object<Input>("Input")
    .field("location", &Input::location)
    ;

  value_object<Output>("Output")
    .field("location", &Output::location)
    .field("power", &Output::power)
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
    .property("is_1x1", &Cell::is_1x1)
    .property("is_grabbable", &Cell::is_grabbable)
    .property("is_latchable", &Cell::is_latchable)
    .property("is_refreshable", &Cell::is_refreshable)
    .property("is_rotateable", &Cell::is_rotateable)
    .property("is_diode", &Cell::is_diode)
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

  register_vector<uint8_t>("vector<uint8_t>");
  register_vector<std::vector<uint8_t>>("vector<vector<uint8_t>>");
  register_vector<std::vector<std::vector<uint8_t>>>("vector<vector<vector<uint8_t>>>");
  register_vector<Bot>("vector<Bot>");
  register_vector<Input>("vector<Input>");
  register_vector<Output>("vector<Output>");
  register_vector<Color>("vector<Color>");
  register_vector<std::vector<Color>>("vector<vector<Color>>");
}
