-- Add 'puzzle' to question_type enum
-- This allows selecting 'puzzle' as a type in the questions table

-- Option 1: If type is an ENUM type
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'puzzle';

-- Option 2: If the above fails because there's no enum, try this:
-- (This adds the constraint if it exists as a CHECK constraint)
-- ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_type_check;
-- ALTER TABLE questions ADD CONSTRAINT questions_type_check 
--   CHECK (type IN ('knowledge', 'upload', 'qr_code', 'multiple_choice', 'picture', 'puzzle'));

-- After running this, you can update your question:
-- UPDATE questions SET type = 'puzzle' WHERE id = 11;
