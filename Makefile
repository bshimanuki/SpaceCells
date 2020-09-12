CC = g++
EMCC = em++

PYTHON_VERSION = 3.8
LBOOST_PYTHON = -lboost_python38

OPT_LVL += -O3
# OPT_LVL += -g

CCFLAGS = -std=c++1z -Wall -Werror
CCFLAGS += $(OPT_LVL)

EMFLAGS = -s ENVIRONMENT=web -s MODULARIZE=1 --closure 1

SRCDIR = src
INCDIR = include
OBJDIR = obj
BINDIR = bin

EMBINDINGS_CPP := $(SRCDIR)/embindings.cpp
PYTHON_CPP := $(SRCDIR)/python_bindings.cpp

ALL_SRCS := $(wildcard $(SRCDIR)/*.cpp)
SRCS := $(filter-out $(EMBINDINGS_CPP) $(PYTHON_CPP), $(ALL_SRCS))
HDRS := $(wildcard $(INCDIR)/*.h)
SRCS_LIBS := $(filter $(patsubst $(INCDIR)/%.h, $(SRCDIR)/%.cpp, $(HDRS)), $(SRCS))
SRCS_MAINS := $(filter-out $(SRCS_LIBS), $(SRCS))
OBJS := $(patsubst $(SRCDIR)/%.cpp, $(OBJDIR)/%.o, $(SRCS))
OBJS_LIBS := $(patsubst $(SRCDIR)/%.cpp, $(OBJDIR)/%.o, $(SRCS_LIBS))
DEPS := $(patsubst $(SRCDIR)/%.cpp, $(OBJDIR)/%.d, $(SRCS))
BINS := $(patsubst $(SRCDIR)/%.cpp, $(BINDIR)/%, $(SRCS_MAINS))

EM_OBJS := $(patsubst $(SRCDIR)/%.cpp, $(OBJDIR)/%.em.o, $(ALL_SRCS))
EM_LIBS := $(patsubst $(SRCDIR)/%.cpp, $(OBJDIR)/%.em.o, $(SRCS_LIBS))
JS := $(patsubst $(SRCDIR)/%.cpp, $(BINDIR)/%.js, $(SRCS_MAINS))
HTML := $(patsubst $(SRCDIR)/%.cpp, $(BINDIR)/%.html, $(SRCS_MAINS))
JS := $(patsubst $(SRCDIR)/%.cpp, $(BINDIR)/%.js, $(SRCS_MAINS))
EMBINDINGS_JS := $(patsubst $(SRCDIR)/%.cpp, $(BINDIR)/%.js, $(EMBINDINGS_CPP))

BINDINGS_PYTHON := $(patsubst $(SRCDIR)/%.cpp, $(BINDIR)/%.so, $(PYTHON_CPP))
BOOST_OBJS := $(patsubst $(SRCDIR)/%.cpp, $(OBJDIR)/%.boost.o, $(PYTHON_CPP))

INC = -I./include
PYTHON_INCLUDE = -I/usr/include/python$(PYTHON_VERSION)

DEP_OPTIONS := -MMD -MP
BOOST_FLAGS := -fPIC
LDFLAGS :=
LDBOOST :=  $(LBOOST_PYTHON)

$(OBJDIR)/%.o: $(SRCDIR)/%.cpp
	@mkdir -p $(OBJDIR)
	$(CC) $(DEP_OPTIONS) $(CCFLAGS) $(BOOST_FLAGS) -o $@ -c $< $(INC)

$(BINDIR)/%: $(OBJDIR)/%.o $(OBJS_LIBS)
	@mkdir -p $(BINDIR)
	$(CC) $(CCFLAGS) -o $@ $^ $(INC) $(LDFLAGS)

$(BINDIR)/%.so: $(OBJDIR)/%.boost.o $(OBJS_LIBS)
	@mkdir -p $(BINDIR)
	$(CC) $(CCFLAGS) --shared -o $@ $^ $(INC) $(PYTHON_INCLUDE) $(LDFLAGS) $(LDBOOST)

$(OBJDIR)/%.boost.o: $(SRCDIR)/%.cpp
	@mkdir -p $(OBJDIR)
	$(CC) $(DEP_OPTIONS) $(CCFLAGS) $(BOOST_FLAGS) -o $@ -c $< $(INC) $(PYTHON_INCLUDE)

$(OBJDIR)/%.em.o: $(SRCDIR)/%.cpp
	@mkdir -p $(OBJDIR)
	$(EMCC) $(DEP_OPTIONS) $(CCFLAGS) -o $@ -c $< $(INC)

$(BINDIR)/%.html $(BINDIR)/%.js: $(OBJDIR)/%.em.o $(EM_LIBS)
	@mkdir -p $(BINDIR)
	$(EMCC) $(CCFLAGS) $(EMFLAGS) -o $@ $^ $(INC) $(LDFLAGS) --bind

.PHONY: clean

.SECONDARY: $(OBJS) $(DEPS) $(EM_OBJS) $(BOOST_OBJS)

default: $(BINS)

# emscripten: $(HTML)
# emscripten: $(JS)
emscripten: $(EMBINDINGS_JS)

python: $(BINDINGS_PYTHON)

all: default emscripten python

clean:
	rm -rf $(OBJDIR) $(BINDIR)

-include $(DEPS)
