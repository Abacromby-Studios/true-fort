<?php
// process_form.php

// Configure these settings
$recipientEmail = "support@abacromby9-studios.xyz";
$uploadDir = "uploads/";
$maxFileSize = 50 * 1024 * 1024; // 50MB

// Process form submission
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Basic validation
    $errors = [];
    
    // Required fields
    if (empty($_POST['email'])) {
        $errors[] = "Email address is required.";
    } elseif (!filter_var($_POST['email'], FILTER_VALIDATE_EMAIL)) {
        $errors[] = "Invalid email format.";
    }
    
    if (empty($_POST['username'])) {
        $errors[] = "Minecraft username is required.";
    }
    
    if (empty($_POST['subject'])) {
        $errors[] = "Support subject is required.";
    }
    
    // Subject-specific validation
    $subject = $_POST['subject'];
    switch ($subject) {
        case 'player_report':
            if (empty($_FILES['violation_evidence']['name'])) {
                $errors[] = "Evidence file is required for player reports.";
            } elseif ($_FILES['violation_evidence']['size'] > $maxFileSize) {
                $errors[] = "File size must be less than 50MB.";
            }
            if (empty($_POST['broken_rule'])) {
                $errors[] = "Please specify which rule was broken.";
            }
            break;
            
        case 'general_support':
            if (empty($_POST['general_subject'])) {
                $errors[] = "Subject is required for general support.";
            }
            if (empty($_POST['general_description'])) {
                $errors[] = "Description is required for general support.";
            }
            break;
            
        case 'legal_inquiry':
            if (empty($_POST['legal_subject'])) {
                $errors[] = "Subject is required for legal inquiries.";
            }
            if (empty($_POST['legal_description'])) {
                $errors[] = "Description is required for legal inquiries.";
            }
            break;
            
        case 'appeal_request':
            if (empty($_POST['enforcement_action'])) {
                $errors[] = "Please specify the enforcement action you're appealing.";
            }
            if (empty($_POST['enforcement_reason'])) {
                $errors[] = "Please provide the reason given for the action.";
            }
            if (empty($_POST['appeal_reason'])) {
                $errors[] = "Please explain why this action should be lifted.";
            }
            break;
    }
    
    // If no errors, process the form
    if (empty($errors)) {
        // Handle file upload if present
        $fileInfo = [];
        if (!empty($_FILES['violation_evidence']['name'])) {
            $fileName = basename($_FILES['violation_evidence']['name']);
            $targetFile = $uploadDir . uniqid() . '_' . $fileName;
            
            // Check file type
            $fileType = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
            $allowedTypes = ['mp4', 'mov', 'avi', 'mkv', 'webm'];
            
            if (!in_array($fileType, $allowedTypes)) {
                $errors[] = "Only video files are allowed (MP4, MOV, AVI, MKV, WEBM).";
            } elseif (move_uploaded_file($_FILES['violation_evidence']['tmp_name'], $targetFile)) {
                $fileInfo = [
                    'name' => $fileName,
                    'path' => $targetFile,
                    'size' => $_FILES['violation_evidence']['size']
                ];
            } else {
                $errors[] = "Sorry, there was an error uploading your file.";
            }
        }
        
        if (empty($errors)) {
            // Prepare email content
            $subjectLine = "Support Request: " . ucfirst(str_replace('_', ' ', $subject));
            $emailContent = "New support request from abacromby9-studios.xyz/contact\n\n";
            $emailContent .= "Email: " . $_POST['email'] . "\n";
            $emailContent .= "Minecraft Username: " . $_POST['username'] . "\n";
            $emailContent .= "Subject: " . ucfirst(str_replace('_', ' ', $subject)) . "\n\n";
            
            // Add subject-specific content
            switch ($subject) {
                case 'player_report':
                    $emailContent .= "Alleged Rule Violation: " . $_POST['broken_rule'] . "\n";
                    $emailContent .= "Evidence File: " . ($fileInfo ? $fileInfo['name'] : "None") . "\n";
                    break;
                    
                case 'general_support':
                    $emailContent .= "Subject: " . $_POST['general_subject'] . "\n";
                    $emailContent .= "Description:\n" . $_POST['general_description'] . "\n";
                    break;
                    
                case 'legal_inquiry':
                    $emailContent .= "Subject: " . $_POST['legal_subject'] . "\n";
                    $emailContent .= "Description:\n" . $_POST['legal_description'] . "\n";
                    break;
                    
                case 'appeal_request':
                    $emailContent .= "Enforcement Action: " . $_POST['enforcement_action'] . "\n";
                    $emailContent .= "Original Reason: " . $_POST['enforcement_reason'] . "\n";
                    $emailContent .= "Appeal Reason:\n" . $_POST['appeal_reason'] . "\n";
                    $emailContent .= "Additional Notes:\n" . ($_POST['appeal_notes'] ?: "None") . "\n";
                    break;
            }
            
            // Send email
            $headers = "From: " . $_POST['email'] . "\r\n";
            $headers .= "Reply-To: " . $_POST['email'] . "\r\n";
            
            if (mail($recipientEmail, $subjectLine, $emailContent, $headers)) {
                // Success - redirect to thank you page
                header("Location: ../contact/thank-you.html");
                exit();
            } else {
                $errors[] = "Failed to send email. Please try again later.";
            }
        }
    }
    
    // If we got here, there were errors
    session_start();
    $_SESSION['form_errors'] = $errors;
    $_SESSION['form_data'] = $_POST;
    header("Location: index.html?error=1");
    exit();
}
?>
