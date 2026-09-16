const fs = require('fs');
let html = fs.readFileSync('frontend/profile.html', 'utf8');

const target = '<div class="profile-content auth-protected">';
const replacement = `<div id="emptyProfile" class="empty-state" style="display: none;"></div>\n            <div class="profile-content auth-protected">`;

html = html.replace(target, replacement);
fs.writeFileSync('frontend/profile.html', html);
