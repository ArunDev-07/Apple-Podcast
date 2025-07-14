<?php
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

function validateRequired($value, $fieldName) {
    if (empty(trim($value))) {
        throw new Exception($fieldName . ' is required');
    }
    return true;
}

function validateLength($value, $fieldName, $min, $max) {
    $length = strlen($value);
    if ($length < $min) {
        throw new Exception($fieldName . ' must be at least ' . $min . ' characters');
    }
    if ($length > $max) {
        throw new Exception($fieldName . ' must not exceed ' . $max . ' characters');
    }
    return true;
}

function sanitizeInput($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}
?>