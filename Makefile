CC = g++

# OPT_LVL = -O3
OPT_LVL = -g

CCFLAGS = -std=c++1z -Wall -Werror
CCFLAGS += $(OPT_LVL)

SRCDIR = src
INCDIR = include
OBJDIR = obj
BINDIR = bin

SRCS := $(wildcard $(SRCDIR)/*.cpp)
HDRS := $(wildcard $(INCDIR)/*.h)
SRCS_LIBS := $(filter $(patsubst $(INCDIR)/%.h, $(SRCDIR)/%.cpp, $(HDRS)), $(SRCS))
SRCS_MAINS := $(filter-out $(SRCS_LIBS), $(SRCS))
OBJS := $(patsubst $(SRCDIR)/%.cpp, $(OBJDIR)/%.o, $(SRCS))
OBJS_LIBS := $(patsubst $(SRCDIR)/%.cpp, $(OBJDIR)/%.o, $(SRCS_LIBS))
DEPS := $(patsubst $(SRCDIR)/%.cpp, $(OBJDIR)/%.d, $(SRCS))
BINS := $(patsubst $(SRCDIR)/%.cpp, $(BINDIR)/%, $(SRCS_MAINS))
PYTHON_MAINS := $(wildcard */__main__.py)
PYSCRIPTS := $(patsubst %/__main__.py, $(BINDIR)/%, $(PYTHON_MAINS))

INC = -I./include
LDFLAGS = -lpthread -lz -lm

$(OBJDIR)/%.o: $(SRCDIR)/%.cpp
	@mkdir -p $(OBJDIR)
	$(CC) -MMD -MP $(CCFLAGS) -o $@ -c $< $(INC)

$(BINDIR)/%: $(OBJDIR)/%.o $(OBJS_LIBS)
	@mkdir -p $(BINDIR)
	$(CC) $(CCFLAGS) -o $@ $^ $(INC) $(LDFLAGS)

$(BINDIR)/%: %/__main__.py
	@mkdir -p $(BINDIR)
	printf '#!/bin/bash\nPYTHONPATH+=:$$(dirname $$(dirname $$(readlink -f $${BASH_SOURCE[0]} || readlink $${BASH_SOURCE[0]}))) python3 -m $(<D) "$$@"\n' > $@
	chmod +x $@

.PHONY: clean

.SECONDARY: $(OBJS) $(DEPS)

default: $(BINS) $(PYSCRIPTS)

all: default

clean:
	rm -rf $(OBJDIR) $(BINDIR)

-include $(DEPS)
