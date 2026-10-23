-- =====================================================================
-- data.sql — Seeds 30 well-known programming/CS books into the `books`
-- table.
--
-- COVER IMAGES: image_url points to the Open Library Covers API
-- (https://covers.openlibrary.org), a free public service that serves
-- real book cover art by ISBN. This project does NOT bundle or copy any
-- copyrighted cover images into static files — each cover is fetched
-- live, directly from Open Library's own servers, the same way any
-- website links to an external image. If a given ISBN has no cover on
-- file there, the frontend automatically falls back to a placeholder
-- icon (see book-thumb.placeholder in the UI), so nothing breaks.
--
-- IDEMPOTENT: uses INSERT IGNORE keyed off the unique `isbn` column, so
-- running this file again (e.g. on every app restart) will not create
-- duplicates or throw errors once the rows already exist.
--
-- This file is wired to run automatically via:
--   spring.jpa.defer-datasource-initialization=true
--   spring.sql.init.mode=always
-- in application.properties (Hibernate creates the table first, then
-- this file runs). The existing Java-based DataInitializer for the
-- admin module's 5 sample books will detect books already exist and
-- skip its own seeding — no conflict, no duplicates.
-- =====================================================================

INSERT IGNORE INTO books (title, author, category, isbn, publisher, published_year, total_copies, available_copies, price, image_url, description) VALUES
('Clean Code', 'Robert C. Martin', 'Software Engineering', '9780132350884', 'Prentice Hall', 2008, 6, 6, 45.00, 'https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg', 'A handbook of agile software craftsmanship, teaching principles and practices for writing readable, maintainable code.'),
('Effective Java', 'Joshua Bloch', 'Java', '9780134685991', 'Addison-Wesley', 2018, 5, 5, 52.99, 'https://covers.openlibrary.org/b/isbn/9780134685991-L.jpg', 'Best practices for the Java platform, covering language and library features through Java 9.'),
('Head First Java', 'Kathy Sierra & Bert Bates', 'Java', '9780596009205', 'O''Reilly Media', 2005, 5, 5, 44.99, 'https://covers.openlibrary.org/b/isbn/9780596009205-L.jpg', 'A brain-friendly introduction to Java covering objects, threads, networking, and more.'),
('Java: The Complete Reference', 'Herbert Schildt', 'Java', '9780071808552', 'McGraw-Hill', 2014, 4, 4, 39.99, 'https://covers.openlibrary.org/b/isbn/9780071808552-L.jpg', 'A comprehensive reference covering the Java language, its keywords, syntax, and core libraries.'),
('Spring in Action', 'Craig Walls', 'Java', '9781617294945', 'Manning Publications', 2018, 5, 5, 49.99, 'https://covers.openlibrary.org/b/isbn/9781617294945-L.jpg', 'A hands-on guide to building applications with the Spring Framework, including Spring Boot.'),
('Python Crash Course', 'Eric Matthes', 'Python', '9781593279288', 'No Starch Press', 2015, 6, 6, 34.99, 'https://covers.openlibrary.org/b/isbn/9781593279288-L.jpg', 'A fast-paced, thorough introduction to Python programming through real projects.'),
('Think Python', 'Allen B. Downey', 'Python', '9781491939369', 'O''Reilly Media', 2015, 5, 5, 32.99, 'https://covers.openlibrary.org/b/isbn/9781491939369-L.jpg', 'An introduction to Python programming and computer science concepts for beginners.'),
('Learning SQL', 'Alan Beaulieu', 'SQL', '9780596520829', 'O''Reilly Media', 2009, 5, 5, 39.99, 'https://covers.openlibrary.org/b/isbn/9780596520829-L.jpg', 'A guide to writing and understanding SQL, from basic queries to complex joins.'),
('Database System Concepts', 'Silberschatz, Korth & Sudarshan', 'Database', '9780078022159', 'McGraw-Hill', 2010, 4, 4, 65.00, 'https://covers.openlibrary.org/b/isbn/9780078022159-L.jpg', 'A foundational textbook on database design, relational theory, and transaction management.'),
('Operating System Concepts', 'Silberschatz, Galvin & Gagne', 'Operating Systems', '9781118063330', 'Wiley', 2012, 4, 4, 68.00, 'https://covers.openlibrary.org/b/isbn/9781118063330-L.jpg', 'A classic textbook covering processes, memory management, file systems, and concurrency.'),
('Computer Networks', 'Andrew S. Tanenbaum', 'Networking', '9780132126953', 'Pearson', 2010, 4, 4, 62.00, 'https://covers.openlibrary.org/b/isbn/9780132126953-L.jpg', 'A comprehensive text on network architecture, protocols, and the internet.'),
('Data Structures and Algorithms in Java', 'Robert Lafore', 'Data Structures', '9780672324536', 'Sams Publishing', 2002, 5, 5, 47.99, 'https://covers.openlibrary.org/b/isbn/9780672324536-L.jpg', 'A practical, example-driven introduction to data structures and algorithms using Java.'),
('Introduction to Algorithms', 'Cormen, Leiserson, Rivest & Stein', 'Algorithms', '9780262033848', 'MIT Press', 2009, 4, 4, 89.00, 'https://covers.openlibrary.org/b/isbn/9780262033848-L.jpg', 'The definitive, rigorous reference on algorithms and their analysis, widely used in academia.'),
('The Pragmatic Programmer', 'Andrew Hunt & David Thomas', 'Software Engineering', '9780201616224', 'Addison-Wesley', 1999, 5, 5, 42.00, 'https://covers.openlibrary.org/b/isbn/9780201616224-L.jpg', 'Timeless advice on craftsmanship, tooling, and pragmatic approaches to software development.'),
('Design Patterns', 'Erich Gamma, Richard Helm, Ralph Johnson & John Vlissides', 'Software Engineering', '9780201633610', 'Addison-Wesley', 1994, 4, 4, 54.99, 'https://covers.openlibrary.org/b/isbn/9780201633610-L.jpg', 'The classic "Gang of Four" catalog of reusable object-oriented design patterns.'),
('You Don''t Know JS: Up & Going', 'Kyle Simpson', 'JavaScript', '9781491924464', 'O''Reilly Media', 2015, 5, 5, 24.99, 'https://covers.openlibrary.org/b/isbn/9781491924464-L.jpg', 'A concise on-ramp to JavaScript and programming fundamentals for newer developers.'),
('Eloquent JavaScript', 'Marijn Haverbeke', 'JavaScript', '9781593279509', 'No Starch Press', 2018, 5, 5, 34.99, 'https://covers.openlibrary.org/b/isbn/9781593279509-L.jpg', 'A modern introduction to JavaScript, programming, and the wonders of the digital.'),
('HTML & CSS: Design and Build Websites', 'Jon Duckett', 'Web Development', '9781118008188', 'Wiley', 2011, 6, 6, 34.99, 'https://covers.openlibrary.org/b/isbn/9781118008188-L.jpg', 'A visually rich guide to building websites with HTML and CSS from the ground up.'),
('JavaScript: The Good Parts', 'Douglas Crockford', 'JavaScript', '9780596517748', 'O''Reilly Media', 2008, 5, 5, 29.99, 'https://covers.openlibrary.org/b/isbn/9780596517748-L.jpg', 'A focused look at the best features of JavaScript, distilled from a famously flawed language.'),
('Artificial Intelligence: A Modern Approach', 'Stuart Russell & Peter Norvig', 'Artificial Intelligence', '9780134610993', 'Pearson', 2020, 3, 3, 95.00, 'https://covers.openlibrary.org/b/isbn/9780134610993-L.jpg', 'The leading textbook in AI, covering search, logic, learning, and intelligent agents.'),
('Deep Learning', 'Ian Goodfellow, Yoshua Bengio & Aaron Courville', 'Machine Learning', '9780262035613', 'MIT Press', 2016, 3, 3, 80.00, 'https://covers.openlibrary.org/b/isbn/9780262035613-L.jpg', 'A comprehensive, mathematically grounded introduction to deep learning.'),
('Python Machine Learning', 'Sebastian Raschka', 'Machine Learning', '9781783555130', 'Packt Publishing', 2015, 4, 4, 44.99, 'https://covers.openlibrary.org/b/isbn/9781783555130-L.jpg', 'A practical guide to machine learning and deep learning using Python libraries.'),
('The C Programming Language', 'Brian W. Kernighan & Dennis M. Ritchie', 'C Programming', '9780131103627', 'Prentice Hall', 1988, 5, 5, 37.99, 'https://covers.openlibrary.org/b/isbn/9780131103627-L.jpg', 'The definitive reference on C, written by the language''s own creators.'),
('C++ Primer', 'Stanley B. Lippman, Josee Lajoie & Barbara E. Moo', 'C++', '9780321714114', 'Addison-Wesley', 2012, 4, 4, 59.99, 'https://covers.openlibrary.org/b/isbn/9780321714114-L.jpg', 'A thorough, approachable introduction to modern C++ for new and experienced programmers.'),
('Kotlin in Action', 'Dmitry Jemerov & Svetlana Isakova', 'Kotlin', '9781617293290', 'Manning Publications', 2017, 4, 4, 44.99, 'https://covers.openlibrary.org/b/isbn/9781617293290-L.jpg', 'A guide to the Kotlin language written by two of its own designers.'),
('Android Programming: The Big Nerd Ranch Guide', 'Kristin Marsicano, Brian Gardner, Bill Phillips & Chris Stewart', 'Android', '9780134706054', 'Big Nerd Ranch Guides', 2017, 4, 4, 49.99, 'https://covers.openlibrary.org/b/isbn/9780134706054-L.jpg', 'A hands-on, project-based introduction to building Android applications.'),
('React Explained', 'Zac Gordon', 'React', '9780692949422', 'Zac Gordon', 2017, 4, 4, 24.99, 'https://covers.openlibrary.org/b/isbn/9780692949422-L.jpg', 'A friendly walkthrough of React fundamentals, components, and application structure.'),
('Node.js Design Patterns', 'Mario Casciaro & Luciano Mammino', 'Node.js', '9781785885587', 'Packt Publishing', 2016, 4, 4, 44.99, 'https://covers.openlibrary.org/b/isbn/9781785885587-L.jpg', 'Best practices and design patterns for building scalable Node.js applications.'),
('Cracking the Coding Interview', 'Gayle Laakmann McDowell', 'Interview Preparation', '9780984782857', 'CareerCup', 2015, 6, 6, 39.99, 'https://covers.openlibrary.org/b/isbn/9780984782857-L.jpg', '189 programming interview questions and solutions, with strategies for technical interviews.'),
('Grokking Algorithms', 'Aditya Bhargava', 'Algorithms', '9781617292231', 'Manning Publications', 2016, 5, 5, 34.99, 'https://covers.openlibrary.org/b/isbn/9781617292231-L.jpg', 'An illustrated, beginner-friendly introduction to algorithms and how to think about them.');
