src_dpath = /Users/jimw/self/riscv-training/slide/hugo

ls_md = $(wildcard 0*.md) $(wildcard 1*.md) $(wildcard 2*.md)

default:
	echo $(ls_md)

copy:
	cp -rf $(src_dpath)/../image .
	cp -rf $(src_dpath)/*.md .

relocate:
	$(foreach md,$(ls_md),gsed -i "s|../image/|image/|g" $(md);)

clean:
	-rm -rf *.md image
	
.PHONY: copy clean
