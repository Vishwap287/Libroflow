package com.library.service;

import com.library.exception.ResourceNotFoundException;
import com.library.model.Member;
import com.library.repository.MemberRepository;
import com.library.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;
    private final TransactionRepository transactionRepository;

    public List<Member> getAllMembers() {
        return memberRepository.findAll();
    }

    public Member getMemberById(Long id) {
        return memberRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found with id: " + id));
    }

    public List<Member> searchMembers(String query) {
        if (query == null || query.isBlank()) {
            return getAllMembers();
        }
        return memberRepository.search(query.trim());
    }

    public Member createMember(Member member) {
        return memberRepository.save(member);
    }

    public Member updateMember(Long id, Member updated) {
        Member existing = getMemberById(id);
        existing.setName(updated.getName());
        existing.setEmail(updated.getEmail());
        existing.setPhone(updated.getPhone());
        existing.setAddress(updated.getAddress());
        existing.setStatus(updated.getStatus());
        return memberRepository.save(existing);
    }

    public void deleteMember(Long id) {
        Member member = getMemberById(id);

        // Cascade: remove this member's loan/transaction history first, then the member.
        // (Admin has explicitly chosen "delete means delete" over preserving history here.)
        var relatedTransactions = transactionRepository.findByMemberId(id);
        if (!relatedTransactions.isEmpty()) {
            transactionRepository.deleteAll(relatedTransactions);
        }

        memberRepository.delete(member);
    }
}
