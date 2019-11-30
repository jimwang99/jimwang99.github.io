src_dpath=/Users/jimw/self/riscv-training/slides/hugo

ls_lectur_mde=$(wildcard lecture-*.md)
ls_md=$(ls_lecture_md)

default:
	make clean
	make copy
	make index.md

copy:
	cp -rf $(src_dpath)/../image .
	cp -rf $(src_dpath)/*.md .

index.md: $(ls_md) create_index.py
	./create_index.py

clean:
	-rm -rf *.md image
	
.PHONY: copy clean
