overrides = DISABLE_JIT=1 OBJROOT=build BUILD_OPT=1
uname = $(shell uname)
ifeq "$(findstring CYGWIN,$(uname))" "CYGWIN"
overrides += OS_CONFIG=Cygwin OS_ARCH=Cygwin
endif

all:
	$(MAKE) -f Makefile.ref $(overrides)

clean:
	$(MAKE) -f Makefile.ref $(overrides) clean
