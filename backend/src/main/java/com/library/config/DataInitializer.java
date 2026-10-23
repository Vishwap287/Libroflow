package com.library.config;

import com.library.model.*;
import com.library.repository.BookRepository;
import com.library.repository.MemberRepository;
import com.library.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedUsers();
        seedBooks();
        seedMembers();
    }

    private void seedUsers() {
        if (userRepository.count() == 0) {
            User admin = User.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("admin123"))
                    .fullName("System Administrator")
                    .role(Role.ADMIN)
                    .build();

            User librarian = User.builder()
                    .username("librarian")
                    .password(passwordEncoder.encode("librarian123"))
                    .fullName("Head Librarian")
                    .role(Role.LIBRARIAN)
                    .build();

            userRepository.save(admin);
            userRepository.save(librarian);
            System.out.println("==============================================");
            System.out.println(" Default login created:");
            System.out.println("   username: admin      password: admin123");
            System.out.println("   username: librarian  password: librarian123");
            System.out.println("==============================================");
        }
    }

    private void seedBooks() {
        if (bookRepository.count() == 0) {
            bookRepository.save(Book.builder()
                    .title("Clean Code").author("Robert C. Martin").isbn("9780132350884")
                    .category("Software Engineering").publisher("Prentice Hall").publishedYear(2008)
                    .totalCopies(5).availableCopies(5).price(45.00).rackLocation("A1").build());

            bookRepository.save(Book.builder()
                    .title("Design Patterns").author("Erich Gamma").isbn("9780201633610")
                    .category("Software Engineering").publisher("Addison-Wesley").publishedYear(1994)
                    .totalCopies(3).availableCopies(3).price(50.00).rackLocation("A2").build());

            bookRepository.save(Book.builder()
                    .title("The Pragmatic Programmer").author("Andrew Hunt").isbn("9780201616224")
                    .category("Software Engineering").publisher("Addison-Wesley").publishedYear(1999)
                    .totalCopies(4).availableCopies(4).price(42.00).rackLocation("A3").build());

            bookRepository.save(Book.builder()
                    .title("To Kill a Mockingbird").author("Harper Lee").isbn("9780061120084")
                    .category("Fiction").publisher("J.B. Lippincott & Co.").publishedYear(1960)
                    .totalCopies(6).availableCopies(6).price(15.00).rackLocation("B1").build());

            bookRepository.save(Book.builder()
                    .title("A Brief History of Time").author("Stephen Hawking").isbn("9780553380163")
                    .category("Science").publisher("Bantam Books").publishedYear(1988)
                    .totalCopies(2).availableCopies(2).price(20.00).rackLocation("C1").build());
        }
    }

    private void seedMembers() {
        if (memberRepository.count() == 0) {
            memberRepository.save(Member.builder()
                    .name("Arjun Kumar").email("arjun.kumar@example.com").phone("9876543210")
                    .address("12 Anna Nagar, Madurai").status("ACTIVE").build());

            memberRepository.save(Member.builder()
                    .name("Priya Sharma").email("priya.sharma@example.com").phone("9876500000")
                    .address("45 Gandhi Road, Madurai").status("ACTIVE").build());
        }
    }
}
