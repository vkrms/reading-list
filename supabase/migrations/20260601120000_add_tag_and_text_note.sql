ALTER TABLE reading_list_items
ADD COLUMN IF NOT EXISTS text_note text;

ALTER TABLE reading_list_items
ADD COLUMN IF NOT EXISTS tag text;

UPDATE reading_list_items
SET tag = 'uncategorized'
WHERE tag IS NULL OR btrim(tag) = '';

ALTER TABLE reading_list_items
ALTER COLUMN tag SET NOT NULL;
