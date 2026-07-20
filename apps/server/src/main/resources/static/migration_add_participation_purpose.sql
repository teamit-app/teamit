ALTER TABLE matching_profile ADD COLUMN participation_purpose VARCHAR(20) NULL;
ALTER TABLE contest_participants ADD COLUMN participation_purpose VARCHAR(20) NULL;
ALTER TABLE posts ADD COLUMN purpose_condition VARCHAR(20) NULL;
