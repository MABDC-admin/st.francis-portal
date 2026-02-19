ALTER TABLE notebook_cells 
ADD COLUMN pdf_filename text,
ADD COLUMN pdf_page_count integer,
ADD COLUMN pdf_extracted_text text;