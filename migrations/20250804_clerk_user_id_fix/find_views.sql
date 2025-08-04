-- SQL to find all views in the database
SELECT 
    table_schema,
    table_name,
    view_definition
FROM 
    information_schema.views
WHERE 
    table_schema = 'public';
