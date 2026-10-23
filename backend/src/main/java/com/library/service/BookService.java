package com.library.service;

import com.library.exception.BadRequestException;
import com.library.exception.ResourceNotFoundException;
import com.library.model.Book;
import com.library.repository.BookRepository;
import com.library.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BookService {

    private final BookRepository bookRepository;
    private final TransactionRepository transactionRepository;

    public List<Book> getAllBooks() {
        return bookRepository.findAll();
    }

    public Book getBookById(Long id) {
        return bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + id));
    }

    public List<Book> searchBooks(String query) {
        if (query == null || query.isBlank()) {
            return getAllBooks();
        }
        return bookRepository.search(query.trim());
    }

    public Book createBook(Book book) {
        if (book.getAvailableCopies() == null) {
            book.setAvailableCopies(book.getTotalCopies());
        }
        if (book.getAvailableCopies() > book.getTotalCopies()) {
            throw new BadRequestException("Available copies cannot exceed total copies");
        }
        return bookRepository.save(book);
    }

    public Book updateBook(Long id, Book updated) {
        Book existing = getBookById(id);
        existing.setTitle(updated.getTitle());
        existing.setAuthor(updated.getAuthor());
        existing.setIsbn(updated.getIsbn());
        existing.setCategory(updated.getCategory());
        existing.setPublisher(updated.getPublisher());
        existing.setPublishedYear(updated.getPublishedYear());
        existing.setPrice(updated.getPrice());
        existing.setRackLocation(updated.getRackLocation());
        existing.setImageUrl(updated.getImageUrl());
        existing.setDescription(updated.getDescription());

        int issuedCopies = existing.getTotalCopies() - existing.getAvailableCopies();
        if (updated.getTotalCopies() < issuedCopies) {
            throw new BadRequestException("Total copies cannot be less than copies currently issued (" + issuedCopies + ")");
        }
        existing.setTotalCopies(updated.getTotalCopies());
        existing.setAvailableCopies(updated.getTotalCopies() - issuedCopies);

        return bookRepository.save(existing);
    }

    public void deleteBook(Long id) {
        Book book = getBookById(id);

        // Cascade: remove this book's loan/transaction history first, then the book.
        // (Admin has explicitly chosen "delete means delete" over preserving history here.
        // Note: any Fine records referencing this book keep their own snapshot of the
        // title/author, so they still display correctly even after the book is gone.)
        var relatedTransactions = transactionRepository.findByBookId(id);
        if (!relatedTransactions.isEmpty()) {
            transactionRepository.deleteAll(relatedTransactions);
        }

        bookRepository.delete(book);
    }
}
