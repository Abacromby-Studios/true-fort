// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Field visibility toggling
    const subjectSelect = document.getElementById('subject');
    if (subjectSelect) {
        subjectSelect.addEventListener('change', toggleSubjectFields);
        // Set initial field visibility
        toggleSubjectFields();
    }
    
    // Form submission handler
    const supportForm = document.getElementById('supportForm');
    if (supportForm) {
        supportForm.addEventListener('submit', handleFormSubmit);
    }
});

function toggleSubjectFields() {
    // Hide all subject fields first
    document.querySelectorAll('.subject-fields').forEach(field => {
        if (field) {
            field.style.display = 'none';
        }
    });
    
    // Show only the selected subject's fields
    const selectedSubject = document.getElementById('subject');
    if (selectedSubject && selectedSubject.value) {
        const fieldsToShow = document.getElementById(`${selectedSubject.value}_fields`);
        if (fieldsToShow) {
            fieldsToShow.style.display = 'block';
        }
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('submitBtn');
    if (!submitBtn) return;
    
    // Disable button during submission
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    
    try {
        // Collect ALL form data (including hidden fields)
        const formData = new FormData(e.target);
        const payload = {};
        
        // Convert FormData to object and remove empty values
        formData.forEach((value, key) => {
            if (value) payload[key] = value;
        });
        
        // Send to server
        const response = await fetch('/api/submit-form', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Server error');
        }
        
        // Show success message with null checks
        const formContainer = document.getElementById('supportForm');
        const successMessage = document.getElementById('successMessage');
        
        if (formContainer) formContainer.style.display = 'none';
        if (successMessage) successMessage.style.display = 'block';
    } catch (error) {
        console.error('Submission error:', error);
        alert(`Error: ${error.message || 'Failed to submit form'}`);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Request';
    }
}

// Reset form after successful submission
function resetForm() {
    const form = document.getElementById('supportForm');
    const successMessage = document.getElementById('successMessage');
    
    if (form) {
        form.reset();
        form.style.display = 'block';
    }
    if (successMessage) successMessage.style.display = 'none';
    toggleSubjectFields();
}
