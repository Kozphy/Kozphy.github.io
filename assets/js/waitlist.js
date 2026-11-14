(function () {
  'use strict';

  var FORMSPREE_ENDPOINT = 'https://formspree.io/f/xdegapgp';
  var CONTACT_EMAIL = '';

  var MAX = {
    email: 254,
    name: 100,
    company: 120,
    role: 80,
    pain: 500,
    slot: 120,
    modes: 400
  };

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  var SUCCESS = {
    waitlist: "Thanks, you're on the list. I'll reply within 2 business days.",
    interview: "Thanks — I'll confirm a time within 2 business days.",
    pilot: "Thanks — I'll follow up to scope a paid design pilot.",
    problem: "Got it. Next: book a 20-min discovery call."
  };

  function statusEl(form) {
    return form.querySelector('[data-waitlist-status]');
  }

  function setStatus(form, message, isError) {
    var el = statusEl(form);
    if (!el) return;
    el.textContent = message;
    el.classList.toggle('error', Boolean(isError));
  }

  function fieldValue(form, name) {
    var input = form.elements.namedItem(name);
    if (!input) return '';
    if (typeof input.value === 'string') return input.value.trim();
    return '';
  }

  function setFieldValue(form, name, value) {
    var input = form.elements.namedItem(name);
    if (input && typeof input.value === 'string') input.value = value;
  }

  function checkedValues(form) {
    var nodes = form.querySelectorAll('input[type="checkbox"][data-fail]');
    var out = [];
    nodes.forEach(function (node) {
      if (node.checked) out.push(node.getAttribute('data-fail') || node.value);
    });
    return out;
  }

  function pageSource() {
    var path = window.location.pathname || '/';
    if (path === '/' || path === '' || path.endsWith('/index.html')) return '/';
    return path;
  }

  function formKind(form) {
    return (form.getAttribute('data-form-kind') || 'waitlist').toLowerCase();
  }

  function errorMessage() {
    if (CONTACT_EMAIL) {
      return 'Something went wrong, email me at ' + CONTACT_EMAIL;
    }
    return 'Something went wrong, email me via LinkedIn (Zixsa) with CHECKTRAIL.';
  }

  function subjectFor(kind, company) {
    var co = company || 'unspecified';
    if (kind === 'interview') return 'Checktrail interview: ' + co;
    if (kind === 'pilot') return 'Checktrail paid pilot: ' + co;
    if (kind === 'problem') return 'Checktrail problem affirm: ' + co;
    return 'Checktrail waitlist: ' + co;
  }

  function track(name, detail) {
    if (typeof window.ctTrack === 'function') window.ctTrack(name, detail);
  }

  function validate(form) {
    var kind = formKind(form);
    var email = fieldValue(form, 'email').slice(0, MAX.email);
    var name = fieldValue(form, 'name').slice(0, MAX.name);
    var company = fieldValue(form, 'company').slice(0, MAX.company);
    var role = fieldValue(form, 'role').slice(0, MAX.role);
    var pain = fieldValue(form, 'pain').slice(0, MAX.pain);
    var slot = fieldValue(form, 'slot').slice(0, MAX.slot);
    var budget = fieldValue(form, 'budget_discussable');
    var modes = checkedValues(form).join(', ').slice(0, MAX.modes);

    setFieldValue(form, 'email', email);
    setFieldValue(form, 'name', name);
    setFieldValue(form, 'company', company);
    setFieldValue(form, 'role', role);
    setFieldValue(form, 'pain', pain);
    if (form.elements.namedItem('slot')) setFieldValue(form, 'slot', slot);

    if (!email || !EMAIL_RE.test(email)) {
      return { ok: false, message: 'Enter a valid work email.', focus: 'email' };
    }
    if (kind === 'problem' && !modes) {
      return { ok: false, message: 'Select at least one failure mode.', focus: 'email' };
    }
    if (kind === 'interview' && !pain) {
      return { ok: false, message: 'Tell me which workflow can fail silently.', focus: 'pain' };
    }

    var payload = {
      email: email,
      name: name,
      company: company,
      role: role,
      pain: pain || modes,
      modes: modes,
      slot: slot,
      budget_discussable: budget,
      form_kind: kind,
      source: pageSource(),
      _gotcha: fieldValue(form, '_gotcha'),
      _subject: subjectFor(kind, company)
    };

    return { ok: true, kind: kind, payload: payload };
  }

  function submitFormspree(payload) {
    return fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }).then(function (res) {
      return res
        .json()
        .catch(function () {
          return {};
        })
        .then(function (data) {
          if (!res.ok) {
            var err = new Error((data && data.error) || 'submit_failed');
            err.status = res.status;
            throw err;
          }
          return data;
        });
    });
  }

  function onSubmit(event) {
    event.preventDefault();
    var form = event.currentTarget;
    var button = form.querySelector('button[type="submit"]');
    var result = validate(form);

    if (!result.ok) {
      setStatus(form, result.message, true);
      var focusEl = form.elements.namedItem(result.focus);
      if (focusEl && focusEl.focus) focusEl.focus();
      return;
    }

    setFieldValue(form, 'source', result.payload.source);
    setFieldValue(form, '_subject', result.payload._subject);

    if (result.payload._gotcha) {
      setStatus(form, SUCCESS[result.kind] || SUCCESS.waitlist, false);
      form.reset();
      setFieldValue(form, 'source', pageSource());
      return;
    }

    if (button) {
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
    }
    setStatus(form, 'Sending…', false);

    submitFormspree(result.payload)
      .then(function () {
        track(
          result.kind === 'interview'
            ? 'interview_book'
            : result.kind === 'pilot'
              ? 'pilot_request'
              : result.kind === 'problem'
                ? 'problem_affirm'
                : 'waitlist_submit',
          { source: result.payload.source, form_kind: result.kind }
        );
        setStatus(form, SUCCESS[result.kind] || SUCCESS.waitlist, false);
        if (result.kind === 'problem') {
          window.location.href = 'interview.html?from=problem';
          return;
        }
        form.reset();
        setFieldValue(form, 'source', pageSource());
      })
      .catch(function () {
        setStatus(form, errorMessage(), true);
      })
      .then(function () {
        if (button) {
          button.disabled = false;
          button.removeAttribute('aria-busy');
        }
      });
  }

  document.querySelectorAll('[data-waitlist-form]').forEach(function (form) {
    if (!form.getAttribute('action')) form.setAttribute('action', FORMSPREE_ENDPOINT);
    form.setAttribute('method', 'POST');
    setFieldValue(form, 'source', pageSource());
    form.addEventListener('submit', onSubmit);
  });
})();
