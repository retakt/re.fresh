# Requirements Document

## Introduction

This document specifies requirements for replacing the current client-side tag and category extraction system with a proper database-backed structure. Currently, tags are stored as JSON arrays in content tables (posts, tutorials) and categories are stored as comma-separated strings. This creates inefficiencies in tag management, searching, and prevents central administration of tags and categories across all content types.

The new system will create dedicated `tags` and `categories` tables with junction tables to link them to any content type (posts, tutorials, music, files), enabling efficient querying, central management, usage tracking, and consistent tag/category handling across the application.

## Glossary

- **Tag**: A reusable label that can be applied to any content type to categorize or describe it
- **Category**: A reusable classification that can be applied to any content type for organizational purposes
- **Content**: Any entity that can have tags or categories (posts, tutorials, music, files)
- **Junction_Table**: A many-to-many relationship table linking content to tags or categories
- **Tag_Library**: The complete set of available tags in the system
- **Category_Library**: The complete set of available categories in the system
- **Migration**: The process of moving existing tag and category data from JSON arrays and comma-separated strings to the new database structure
- **Editor**: The UI component where users create or edit content (post-editor, tutorial-editor)
- **Combobox**: The UI component that allows searching and selecting tags/categories

## Requirements

### Requirement 1: Create Tags Table

**User Story:** As a developer, I want a dedicated tags table, so that tags can be managed centrally and reused across all content types.

#### Acceptance Criteria

1. THE System SHALL create a `tags` table with columns: id (UUID primary key), name (text unique not null), slug (text unique not null), created_at (timestamp)
2. THE System SHALL create an index on the `tags.name` column for efficient searching
3. THE System SHALL create an index on the `tags.slug` column for efficient lookups
4. THE System SHALL enforce uniqueness on tag names (case-insensitive)

### Requirement 2: Create Categories Table

**User Story:** As a developer, I want a dedicated categories table, so that categories can be managed centrally and reused across all content types.

#### Acceptance Criteria

1. THE System SHALL create a `categories` table with columns: id (UUID primary key), name (text unique not null), slug (text unique not null), created_at (timestamp)
2. THE System SHALL create an index on the `categories.name` column for efficient searching
3. THE System SHALL create an index on the `categories.slug` column for efficient lookups
4. THE System SHALL enforce uniqueness on category names (case-insensitive)

### Requirement 3: Create Content Tags Junction Table

**User Story:** As a developer, I want a junction table linking content to tags, so that any content type can have multiple tags.

#### Acceptance Criteria

1. THE System SHALL create a `content_tags` table with columns: id (UUID primary key), content_type (text not null), content_id (UUID not null), tag_id (UUID not null references tags), created_at (timestamp)
2. THE System SHALL create a composite unique constraint on (content_type, content_id, tag_id) to prevent duplicate tag assignments
3. THE System SHALL create an index on (content_type, content_id) for efficient content tag lookups
4. THE System SHALL create an index on tag_id for efficient reverse lookups
5. THE System SHALL support content_type values: 'post', 'tutorial', 'music', 'file'
6. WHEN a tag is deleted, THE System SHALL cascade delete all related content_tags entries

### Requirement 4: Create Content Categories Junction Table

**User Story:** As a developer, I want a junction table linking content to categories, so that any content type can have multiple categories.

#### Acceptance Criteria

1. THE System SHALL create a `content_categories` table with columns: id (UUID primary key), content_type (text not null), content_id (UUID not null), category_id (UUID not null references categories), created_at (timestamp)
2. THE System SHALL create a composite unique constraint on (content_type, content_id, category_id) to prevent duplicate category assignments
3. THE System SHALL create an index on (content_type, content_id) for efficient content category lookups
4. THE System SHALL create an index on category_id for efficient reverse lookups
5. THE System SHALL support content_type values: 'post', 'tutorial', 'music', 'file'
6. WHEN a category is deleted, THE System SHALL cascade delete all related content_categories entries

### Requirement 5: Migrate Existing Post Tags

**User Story:** As a developer, I want existing post tags migrated to the new structure, so that no data is lost during the transition.

#### Acceptance Criteria

1. WHEN the migration runs, THE System SHALL extract all unique tags from posts.tags arrays
2. WHEN the migration runs, THE System SHALL insert unique tags into the tags table
3. WHEN the migration runs, THE System SHALL create content_tags entries linking each post to its tags
4. WHEN the migration runs, THE System SHALL preserve all existing tag associations
5. WHEN the migration runs, THE System SHALL handle duplicate tags (case-insensitive) by using a single tag entry

### Requirement 6: Migrate Existing Tutorial Tags

**User Story:** As a developer, I want existing tutorial tags migrated to the new structure, so that no data is lost during the transition.

#### Acceptance Criteria

1. WHEN the migration runs, THE System SHALL extract all unique tags from tutorials.tags arrays
2. WHEN the migration runs, THE System SHALL insert unique tags into the tags table (avoiding duplicates from posts)
3. WHEN the migration runs, THE System SHALL create content_tags entries linking each tutorial to its tags
4. WHEN the migration runs, THE System SHALL preserve all existing tag associations
5. WHEN the migration runs, THE System SHALL handle duplicate tags (case-insensitive) by using a single tag entry

### Requirement 7: Migrate Existing Tutorial Categories

**User Story:** As a developer, I want existing tutorial categories migrated to the new structure, so that no data is lost during the transition.

#### Acceptance Criteria

1. WHEN the migration runs, THE System SHALL extract all unique categories from tutorials.category comma-separated strings
2. WHEN the migration runs, THE System SHALL insert unique categories into the categories table
3. WHEN the migration runs, THE System SHALL create content_categories entries linking each tutorial to its categories
4. WHEN the migration runs, THE System SHALL preserve all existing category associations
5. WHEN the migration runs, THE System SHALL handle duplicate categories (case-insensitive) by using a single category entry

### Requirement 8: Fetch Tags from Database

**User Story:** As a content editor, I want the tag combobox to fetch tags from the database, so that I can see all available tags efficiently.

#### Acceptance Criteria

1. WHEN the post-editor loads, THE Editor SHALL fetch tags from the tags table instead of scanning all posts
2. WHEN the tutorial-editor loads, THE Editor SHALL fetch tags from the tags table instead of scanning all tutorials
3. WHEN a user types in the tag combobox, THE Editor SHALL filter tags by name using a database query
4. THE Editor SHALL display tags in alphabetical order
5. THE Editor SHALL load tags with a maximum response time of 500ms

### Requirement 9: Fetch Categories from Database

**User Story:** As a content editor, I want the category combobox to fetch categories from the database, so that I can see all available categories efficiently.

#### Acceptance Criteria

1. WHEN the tutorial-editor loads, THE Editor SHALL fetch categories from the categories table
2. WHEN a user types in the category combobox, THE Editor SHALL filter categories by name using a database query
3. THE Editor SHALL display categories in alphabetical order
4. THE Editor SHALL load categories with a maximum response time of 500ms

### Requirement 10: Save Content with Tags

**User Story:** As a content editor, I want to save content with selected tags, so that tags are properly linked in the database.

#### Acceptance Criteria

1. WHEN a post is saved, THE Editor SHALL create content_tags entries for all selected tags
2. WHEN a tutorial is saved, THE Editor SHALL create content_tags entries for all selected tags
3. WHEN a post is updated, THE Editor SHALL remove old content_tags entries and create new ones
4. WHEN a tutorial is updated, THE Editor SHALL remove old content_tags entries and create new ones
5. THE Editor SHALL complete tag saving within 1 second

### Requirement 11: Save Content with Categories

**User Story:** As a content editor, I want to save content with selected categories, so that categories are properly linked in the database.

#### Acceptance Criteria

1. WHEN a tutorial is saved, THE Editor SHALL create content_categories entries for all selected categories
2. WHEN a tutorial is updated, THE Editor SHALL remove old content_categories entries and create new ones
3. THE Editor SHALL complete category saving within 1 second

### Requirement 12: Create New Tags On-the-Fly

**User Story:** As a content editor, I want to create new tags while typing in the combobox, so that I can add tags that don't exist yet.

#### Acceptance Criteria

1. WHEN a user types a tag name that doesn't exist and presses Enter, THE Editor SHALL create a new tag in the tags table
2. WHEN a new tag is created, THE Editor SHALL generate a slug from the tag name
3. WHEN a new tag is created, THE Editor SHALL add it to the selected tags list
4. THE Editor SHALL prevent creating duplicate tags (case-insensitive)
5. THE Editor SHALL validate tag names are not empty or whitespace-only

### Requirement 13: Create New Categories On-the-Fly

**User Story:** As a content editor, I want to create new categories while typing in the combobox, so that I can add categories that don't exist yet.

#### Acceptance Criteria

1. WHEN a user types a category name that doesn't exist and presses Enter, THE Editor SHALL create a new category in the categories table
2. WHEN a new category is created, THE Editor SHALL generate a slug from the category name
3. WHEN a new category is created, THE Editor SHALL add it to the selected categories list
4. THE Editor SHALL prevent creating duplicate categories (case-insensitive)
5. THE Editor SHALL validate category names are not empty or whitespace-only

### Requirement 14: Load Content with Tags

**User Story:** As a content editor, I want to see existing tags when editing content, so that I can modify them if needed.

#### Acceptance Criteria

1. WHEN editing a post, THE Editor SHALL fetch associated tags from content_tags junction table
2. WHEN editing a tutorial, THE Editor SHALL fetch associated tags from content_tags junction table
3. THE Editor SHALL display tags in the same format as before migration
4. THE Editor SHALL load content tags within 500ms

### Requirement 15: Load Content with Categories

**User Story:** As a content editor, I want to see existing categories when editing content, so that I can modify them if needed.

#### Acceptance Criteria

1. WHEN editing a tutorial, THE Editor SHALL fetch associated categories from content_categories junction table
2. THE Editor SHALL display categories in the same format as before migration
3. THE Editor SHALL load content categories within 500ms

### Requirement 16: Search Tags by Name

**User Story:** As a content editor, I want to search tags by typing, so that I can quickly find the tag I need.

#### Acceptance Criteria

1. WHEN a user types in the tag combobox, THE Editor SHALL query tags where name contains the search term (case-insensitive)
2. THE Editor SHALL return search results within 300ms
3. THE Editor SHALL display matching tags in alphabetical order
4. THE Editor SHALL show "No tags found" when no matches exist
5. THE Editor SHALL support partial matching (e.g., "intro" matches "introduction")

### Requirement 17: Search Categories by Name

**User Story:** As a content editor, I want to search categories by typing, so that I can quickly find the category I need.

#### Acceptance Criteria

1. WHEN a user types in the category combobox, THE Editor SHALL query categories where name contains the search term (case-insensitive)
2. THE Editor SHALL return search results within 300ms
3. THE Editor SHALL display matching categories in alphabetical order
4. THE Editor SHALL show "No categories found" when no matches exist
5. THE Editor SHALL support partial matching

### Requirement 18: Remove Legacy Tag Columns

**User Story:** As a developer, I want to remove the old tags columns after migration, so that the database schema is clean and consistent.

#### Acceptance Criteria

1. WHEN the migration is complete and verified, THE System SHALL drop the posts.tags column
2. WHEN the migration is complete and verified, THE System SHALL drop the tutorials.tags column
3. WHEN the migration is complete and verified, THE System SHALL drop the tutorials.category column
4. THE System SHALL only drop columns after successful data migration verification

### Requirement 19: Track Tag Usage Count

**User Story:** As a developer, I want to track how many times each tag is used, so that popular tags can be identified for future features.

#### Acceptance Criteria

1. THE System SHALL add a usage_count column to the tags table (integer default 0)
2. WHEN a content_tags entry is created, THE System SHALL increment the tag's usage_count
3. WHEN a content_tags entry is deleted, THE System SHALL decrement the tag's usage_count
4. THE System SHALL maintain accurate usage counts through database triggers or application logic

### Requirement 20: Track Category Usage Count

**User Story:** As a developer, I want to track how many times each category is used, so that popular categories can be identified for future features.

#### Acceptance Criteria

1. THE System SHALL add a usage_count column to the categories table (integer default 0)
2. WHEN a content_categories entry is created, THE System SHALL increment the category's usage_count
3. WHEN a content_categories entry is deleted, THE System SHALL decrement the category's usage_count
4. THE System SHALL maintain accurate usage counts through database triggers or application logic
