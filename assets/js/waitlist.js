(function () {
  'use strict';

  var LINKEDIN = 'https://www.linkedin.com/in/z-ixsa-4843b2262';
  var STORAGE_KEY = 'checktrail-waitlist';

  // Set ONE of these before marketing push for a real inbox capture:
  // Formspree: https://formspree.io/f/xxxxxx
  // Or a mailto address you monitor:
  var FORMSPREE_ENDPOINT = '';
  var MAILTO_ADDRESS = '';

  function statusEl(form) {
    return form.querySelector('[data-waitlist-status]');
  }

  function setStatus(form, message, isError) {
    var el = statusEl(form);
    if (!el) return;
    el.textContent = message;
    el.classList.toggle('error', Boolean(isError));
  }

  function persist(entry) {
    var list = [];
    try {
      list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (!Array.isArray(list)) list = [];
    } catch (e) {
      list = [];
    }
    list.push(entry);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      /* ignore quota */
    }
  }

  function noteText(entry) {
    return (
      'CHECKTRAIL pilot request\n' +
      'Email: ' + entry.email + '\n' +
      'Company: ' + (entry.company || '(not given)') + '\n' +
      'Pain: ' + (entry.pain || '(not given)')
    );
  }

  function copyNote(entry) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(noteText(entry));
      }
    } catch (e) {
      /* ignore */
    }
  }

  function openLinkedInNote(entry) {
    copyNote(entry);
    window.open(LINKEDIN, '_blank', 'noopener');
  }

  function openMailto(entry) {
    var subject = encodeURIComponent('Checktrail pilot request');
    var body = encodeURIComponent(noteText(entry));
    window.location.href =
      'mailto:' + MAILTO_ADDRESS + '?subject=' + subject + '&body=' + body;
  }

  function submitFormspree(endpoint, entry) {
    return fetch(endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: entry.email,
        company: entry.company,
        pain: entry.pain,
        source: 'kozphy.github.io',
        _subject: 'Checktrail waitlist'
      })
    }).then(function (res) {
      if (!res.ok) throw new Error('submit_failed');
      return res;
    });
  }

  function onSubmit(event) {
    event.preventDefault();
    var form = event.currentTarget;
    var emailInput = form.querySelector('[name="email"]');
    var companyInput = form.querySelector('[name="company"]');
    var painInput = form.querySelector('[name="pain"]');
    var email = ((emailInput && emailInput.value) || '').trim();
    var company = ((companyInput && companyInput.value) || '').trim();
    var pain = ((painInput && painInput.value) || '').trim();

    if (!email || email.indexOf('@') === -1) {
      setStatus(form, 'Enter a valid work email.', true);
      if (emailInput) emailInput.focus();
      return;
    }

    var entry = {
      email: email,
      company: company,
      pain: pain,
      at: new Date().toISOString()
    };

    persist(entry);

    var button = form.querySelector('button[type="submit"]');
    if (button) button.disabled = true;

    var done = function (message) {
      setStatus(form, message, false);
      form.reset();
      if (button) button.disabled = false;
    };

    if (FORMSPREE_ENDPOINT) {
      submitFormspree(FORMSPREE_ENDPOINT, entry)
        .then(function () {
          done('Request received. We will follow up by email.');
        })
        .catch(function () {
          if (MAILTO_ADDRESS) {
            openMailto(entry);
            done('Server submit failed. Email draft opened — send to complete.');
          } else {
            openLinkedInNote(entry);
            done('Server submit failed. LinkedIn opened — paste the copied CHECKTRAIL note.');
          }
          if (button) button.disabled = false;
        });
      return;
    }

    if (MAILTO_ADDRESS) {
      openMailto(entry);
      done('Email draft opened with your request. Send it to complete. Also saved in this browser.');
      return;
    }

    openLinkedInNote(entry);
    done(
      'Saved in this browser only (no server inbox yet). LinkedIn opened — send a CHECKTRAIL note (copied when possible).'
    );
  }

  document.querySelectorAll('[data-waitlist-form]').forEach(function (form) {
    form.addEventListener('submit', onSubmit);
  });
})();
