// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Field visibility toggling
    const subjectSelect = document.getElementById('subject');
    if (subjectSelect) {
        subjectSelect.addEventListener('change', toggleSubjectFields);
    }
    
    // Set initial field visibility
    toggleSubjectFields();
    
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
            field.classList.add('hidden');
        }
    });
    
    // Show only the selected subject's fields
    const selectedSubject = document.getElementById('subject');
    if (selectedSubject) {
        const fieldsToShow = document.getElementById(`${selectedSubject.value}_fields`);
        if (fieldsToShow) {
            fieldsToShow.classList.remove('hidden');
        }
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('submitBtn');
    if (!submitBtn) return;
    
    // Disable button during submission
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    
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
        const formContainer = document.getElementById('formContainer');
        const successMessage = document.getElementById('successMessage');
        
        if (formContainer) formContainer.classList.add('hidden');
        if (successMessage) successMessage.classList.remove('hidden');
    } catch (error) {
        console.error('Submission error:', error);
        alert(`Error: ${error.message || 'Failed to submit form'}`);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Request';
    }
}

// Reset form after successful submission
function resetForm() {
    const form = document.getElementById('supportForm');
    const successMessage = document.getElementById('successMessage');
    const formContainer = document.getElementById('formContainer');
    
    if (form) form.reset();
    if (successMessage) successMessage.classList.add('hidden');
    if (formContainer) formContainer.classList.remove('hidden');
    toggleSubjectFields();
}
