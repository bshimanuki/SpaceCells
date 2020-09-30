#include <boost/python.hpp>
#include <boost/python/suite/indexing/vector_indexing_suite.hpp>

#include "simulate.h"
#include "level.h"

using namespace boost::python;
using namespace puzzle;

BOOST_PYTHON_MODULE(python_bindings)
{
  class_<Board>("Board", init<size_t, size_t, size_t>())
    .add_property("m", &Board::get_m)
    .add_property("n", &Board::get_n)
    .add_property("nbots", &Board::get_nbots)
    .add_property("was_next", &Board::get_was_next)
    .add_property("test_case", &Board::get_test_case)
    .add_property("step", &Board::get_step)
    .add_property("cycle", &Board::get_cycle)
    .def("reset_and_validate", static_cast<bool(Board::*)(void)>(&Board::reset_and_validate))
    .def("resolve", &Board::resolve)
    .def("move", &Board::move)
    .def("run", static_cast<std::pair<bool,bool>(Board::*)(size_t)>(&Board::run))
    .def("check_status", &Board::check_status)
    .def("get_error", &Board::get_error)
    .def("get_error_reason", &Board::get_error_reason)
    .def("get_unresolved_board", &Board::get_unresolved_board)
    .def("get_resolved_board", &Board::get_resolved_board)
    .def("get_num_cells", &Board::get_num_cells)
    .def("get_num_instructions", &Board::get_num_instructions)
    .def("get_num_symbols", &Board::get_num_symbols)
    ;
  def("LoadBoard", static_cast<Board(*)(const std::string&, const std::string&)>(&load));

  class_<Bot>("Bot")
    .def(init<>())
    .def_readwrite("location", &Bot::location)
    .def_readwrite("moving", &Bot::moving)
    .def_readwrite("holding", &Bot::holding)
    .def_readwrite("rotating", &Bot::rotating)
    ;

  class_<Location>("Location")
    .def(init<>())
    .def(init<int, int>())
    .def(init<Direction>())
    .def_readwrite("valid", &Location::valid)
    .def_readwrite("y", &Location::y)
    .def_readwrite("x", &Location::x)
    ;

  class_<Direction>("Direction")
    .def(init<>())
    ;

  enum_<Status>("Status")
    .value("INVALID", Status::INVALID)
    .value("RUNNING", Status::RUNNING)
    .value("DONE", Status::DONE)
    ;

  class_<std::pair<bool, bool>>("PairValidErr")
    .def_readwrite("valid", &std::pair<bool, bool>::first)
    .def_readwrite("err", &std::pair<bool, bool>::second)
    ;

  class_<std::vector<Bot>>("vector<Bot>")
    .def(vector_indexing_suite<std::vector<Bot>>())
    ;
}
