-- Add missing columns for real factor analysis
-- Adding columns that the new AnalysisEngine expects

-- Add processing_time_ms and phase to analyses table
ALTER TABLE analyses 
ADD COLUMN processing_time_ms INTEGER,
ADD COLUMN phase TEXT DEFAULT 'instant';

-- Add processing_time_ms and phase to analysis_factors table  
ALTER TABLE analysis_factors
ADD COLUMN processing_time_ms INTEGER DEFAULT 0,
ADD COLUMN phase TEXT DEFAULT 'instant';

-- Update existing records to have default values
UPDATE analyses SET 
  processing_time_ms = 0,
  phase = 'instant'
WHERE processing_time_ms IS NULL OR phase IS NULL;

UPDATE analysis_factors SET
  processing_time_ms = 0,
  phase = 'instant'  
WHERE processing_time_ms IS NULL OR phase IS NULL;