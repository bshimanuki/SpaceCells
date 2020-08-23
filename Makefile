CC = g++
EMCC = em++

OPT_LVL += -O3
OPT_LVL += -g

CCFLAGS = -std=c++1z -Wall -Werror
CCFLAGS += $(OPT_LVL)

SRCDIR = src
INCDIR = include
OBJDIR = obj
BINDIR = bin

EMBINDINGS_CPP := $(SRCDIR)/embindings.cpp

ALL_SRCS := $(wildcard $(SRCDIR)/*.cpp)
SRCS := $(filter-out $(EMBINDINGS_CPP), $(ALL_SRCS))
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

INC = -I./include

$(OBJDIR)/%.o: $(SRCDIR)/%.cpp
	@mkdir -p $(OBJDIR)
	$(CC) -MMD -MP $(CCFLAGS) -o $@ -c $< $(INC)

$(BINDIR)/%: $(OBJDIR)/%.o $(OBJS_LIBS)
	@mkdir -p $(BINDIR)
	$(CC) $(CCFLAGS) -o $@ $^ $(INC) $(LDFLAGS)

$(OBJDIR)/%.em.o: $(SRCDIR)/%.cpp
	@mkdir -p $(OBJDIR)
	$(EMCC) -MMD -MP $(CCFLAGS) -o $@ -c $< $(INC)

$(BINDIR)/%.js: $(OBJDIR)/%.em.o $(EM_LIBS)
	@mkdir -p $(BINDIR)
	$(EMCC) $(CCFLAGS) -o $@ $^ $(INC) $(LDFLAGS) --bind

$(BINDIR)/%.html: $(OBJDIR)/%.em.o $(EM_LIBS)
	@mkdir -p $(BINDIR)
	$(EMCC) $(CCFLAGS) -o $@ $^ $(INC) $(LDFLAGS) --bind

.PHONY: clean

.SECONDARY: $(OBJS) $(DEPS) $(EM_OBJS)

default: $(BINS)

# emscripten: $(HTML)
# emscripten: $(JS)
emscripten: $(EMBINDINGS_JS)

all: default

clean:
	rm -rf $(OBJDIR) $(BINDIR)

-include $(DEPS)
