overrides = DISABLE_JIT=1 OBJROOT=build BUILD_OPT=1
uname = $(shell uname)
ifeq "$(findstring CYGWIN,$(uname))" "CYGWIN"
overrides += OS_CONFIG=Cygwin OS_ARCH=Cygwin
else
ifeq "$(findstring MINGW,$(uname))" "MINGW"
overrides += OS_CONFIG=MSYS OS_ARCH=MSYS
endif
endif

all:
	$(MAKE) -f Makefile.ref $(overrides)

clean:
	$(MAKE) -f Makefile.ref $(overrides) clean
