
const menuToggle = document.getElementById('menuToggle');
const nav = document.getElementById('nav');

function closeMobileMenu() {
  if (!menuToggle || !nav) return;

  nav.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
}

if (menuToggle && nav) {
  menuToggle.addEventListener('click', (event) => {
    event.stopPropagation();

    const isOpen = nav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMobileMenu);
  });

  document.addEventListener('click', (event) => {
    if (
      nav.classList.contains('open') &&
      !nav.contains(event.target) &&
      !menuToggle.contains(event.target)
    ) {
      closeMobileMenu();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMobileMenu();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 650) {
      closeMobileMenu();
    }
  });
}

const yearElement = document.getElementById('year');

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

// Hard-coded projects and projects created through add-project.html share one documentation modal.
const recentProjectGrid = document.getElementById('recentProjectGrid');
if (recentProjectGrid) {
  let projectModal = document.getElementById('projectDocumentationModal');
  if (!projectModal) {
    projectModal = document.createElement('div');
    projectModal.id = 'projectDocumentationModal';
    projectModal.className = 'project-modal';
    projectModal.hidden = true;
    projectModal.innerHTML = `
      <div class="project-modal-backdrop" data-close-project-modal></div>
      <section class="project-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="projectModalTitle" tabindex="-1">
        <button type="button" class="project-modal-close" aria-label="Close project details" data-close-project-modal>×</button>
        <div class="project-modal-kicker">PROJECT DOCUMENTATION</div>
        <h2 id="projectModalTitle"></h2>
        <p class="project-modal-category"></p>
        <p class="project-modal-description"></p>
        <div class="project-modal-docs"></div>
        <div class="project-modal-gallery">
          <div class="project-modal-main-wrap"><img class="project-modal-main" alt="Project screenshot"></div>
          <div class="project-modal-thumbnails" aria-label="All project screenshots"></div>
        </div>
        <p class="project-modal-help">Select any thumbnail to view the image. Add your screenshots, diagrams, and documentation images to the project card's gallery.</p>
      </section>`;
    document.body.appendChild(projectModal);
  }

  const modalDialog = projectModal.querySelector('.project-modal-dialog');
  const modalTitle = projectModal.querySelector('#projectModalTitle');
  const modalCategory = projectModal.querySelector('.project-modal-category');
  const modalDescription = projectModal.querySelector('.project-modal-description');
  const modalDocs = projectModal.querySelector('.project-modal-docs');
  const modalMain = projectModal.querySelector('.project-modal-main');
  const modalThumbnails = projectModal.querySelector('.project-modal-thumbnails');
  let lastFocusedProjectCard = null;

  function openProjectModal(project, images, trigger) {
    lastFocusedProjectCard = trigger;
    modalTitle.textContent = project.title || 'Untitled project';
    modalCategory.textContent = project.category || 'CAPSTONE PROJECT';
    modalDescription.textContent = project.description || '';
    modalDocs.replaceChildren();
    // Clear details left over from the previously opened project.
    const existingExtra = projectModal.querySelector('.project-modal-extra');

    if (existingExtra) {
      existingExtra.replaceChildren();
    }



    if (project.technologies) {
      const tech = document.createElement('p');
      tech.className = 'project-modal-tech';
      tech.textContent = `Technologies: ${project.technologies}`;
      modalDocs.appendChild(tech);
    }

    modalThumbnails.replaceChildren();
    const usableImages = images.length ? images : ['assets/camtrack.svg'];

    function showImage(src, index, button) {
      modalMain.src = src;
      modalMain.alt = `${project.title || 'Project'} documentation image ${index + 1}`;
      modalThumbnails.querySelectorAll('button').forEach(item => {
        item.classList.remove('active');
        item.setAttribute('aria-pressed', 'false');
      });
      if (button) {
        button.classList.add('active');
        button.setAttribute('aria-pressed', 'true');
      }
    }

    usableImages.forEach((src, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'project-modal-thumb';
      button.setAttribute('aria-label', `View image ${index + 1} of ${usableImages.length}`);
      button.setAttribute('aria-pressed', 'false');
      const image = document.createElement('img');
      image.src = src;
      image.alt = '';
      image.loading = 'lazy';
      image.onerror = () => { image.alt = 'Image could not be loaded'; };
      const label = document.createElement('span');
      label.textContent = `Image ${index + 1}`;
      button.append(image, label);
      button.addEventListener('click', () => showImage(src, index, button));
      modalThumbnails.appendChild(button);
      if (index === 0) showImage(src, index, button);
    });

    projectModal.hidden = false;
    document.body.classList.add('project-modal-open');
    modalDialog.focus();
  }

  function getCardProject(card) {
    const title = card.dataset.projectTitle || card.querySelector('.work-meta h3, h3')?.textContent.trim() || 'Untitled project';
    const category = card.dataset.projectCategory || card.querySelector('.work-type')?.textContent.trim() || 'CAPSTONE PROJECT';
    const description = card.dataset.projectDescription || card.querySelector('.work-meta p, p')?.textContent.trim() || '';
    const documentation = card.dataset.projectDocumentation || '';
    const technologies = card.dataset.projectTechnologies || '';
    const galleryImages = [...card.querySelectorAll('.project-gallery img, .project-image')]
      .map(img => img.getAttribute('src'))
      .filter(Boolean);
    const images = galleryImages.length ? galleryImages : (card.dataset.projectImage ? [card.dataset.projectImage] : []);
    return { project: { title, category, description, documentation, technologies }, images };
  }

  function bindProjectCard(card) {
    if (card.dataset.documentationBound === 'true') return;
    card.dataset.documentationBound = 'true';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    const info = getCardProject(card);
    card.setAttribute('aria-label', `Open ${info.project.title} images and documentation`);
    card.addEventListener('click', event => {
      // Gallery thumbnails still work as previews without opening the modal first.
      if (event.target.closest('.project-gallery-thumb')) return;
      const current = getCardProject(card);
      openProjectModal(current.project, current.images, card);
    });
    card.addEventListener('keydown', event => {
      if (event.target !== card) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        const current = getCardProject(card);
        openProjectModal(current.project, current.images, card);
      }
    });
  }

  function closeProjectModal() {
    projectModal.hidden = true;
    document.body.classList.remove('project-modal-open');
    if (lastFocusedProjectCard) lastFocusedProjectCard.focus();
  }

  projectModal.querySelectorAll('[data-close-project-modal]').forEach(button => button.addEventListener('click', closeProjectModal));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !projectModal.hidden) closeProjectModal();
  });

  // Enable clicking on projects hard-coded directly in index.html.
recentProjectGrid
  .querySelectorAll('.work-card:not(.recent-project-card)')
  .forEach(bindProjectCard);

  // Also display projects added using add-project.html in the same grid.
  // Static projects live in index.html so they work on GitHub Pages.
  recentProjectGrid.querySelectorAll('.recent-project-card').forEach(card => {
    const title = card.querySelector('h3')?.textContent?.trim() || 'Project';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `View ${title} project images and documentation`);
    const gallery = card.querySelector('.project-gallery-data');
    const images = gallery ? [...gallery.querySelectorAll('img')].map(img => img.getAttribute('src')).filter(Boolean) : [];
    const documentLink = gallery?.querySelector('[data-project-document]');
    const project = {
      title,
      category: card.querySelector('.work-type')?.textContent?.trim() || 'CAPSTONE PROJECT',
      description: card.querySelector('.work-meta p')?.textContent?.trim() || '',
      features: gallery?.dataset.projectFeatures || ''
    };
    const openDetails = () => {
      openProjectModal(project, images, card);
      // Add feature list and documentation link inside the modal, if not already present.
      let extra = projectModal.querySelector('.project-modal-extra');
      if (!extra) {
        extra = document.createElement('div');
        extra.className = 'project-modal-extra';
        projectModal.querySelector('.project-modal-dialog').appendChild(extra);
      }
      extra.replaceChildren();
      if (project.features) {
        const heading = document.createElement('h3'); heading.textContent = 'Key features'; extra.appendChild(heading);
        const list = document.createElement('ul');
        project.features.split('|').map(x => x.trim()).filter(Boolean).forEach(feature => {
          const li = document.createElement('li'); li.textContent = feature; list.appendChild(li);
        });
        extra.appendChild(list);
      }
      if (documentLink) {
        const link = document.createElement('a');
        link.href = documentLink.getAttribute('href');
        link.target = '_blank'; link.rel = 'noopener noreferrer';
        link.textContent = documentLink.textContent.trim();
        link.className = 'project-document-link';
        extra.appendChild(link);
      }
    };
    card.addEventListener('click', event => {
      if (event.target.closest('a, button')) return;
      openDetails();
    });
    card.addEventListener('keydown', event => {
      if (event.target !== card) return;
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openDetails(); }
    });
  });
}

/*
  CUSTOMIZE THIS EMAIL BEFORE PUBLISHING:
  Replace the placeholder with your real contact email.
  The form uses mailto so submissions are not saved by this static website.
*/
const CONTACT_EMAIL = 'gorospealdrix@gmail.com';

const projectForm = document.getElementById('projectForm');
const formMessage = document.getElementById('formMessage');

if (projectForm && formMessage) projectForm.addEventListener('submit', (event) => {
  event.preventDefault();

  if (!projectForm.reportValidity()) return;

  const formData = new FormData(projectForm);
  const name = String(formData.get('name') || '').trim();
  const email = String(formData.get('email') || '').trim();
  const projectType = String(formData.get('projectType') || '').trim();
  const budget = String(formData.get('budget') || 'Not specified').trim();
  const details = String(formData.get('details') || '').trim();

  if (!name || !email || !projectType || !details) {
    formMessage.textContent = 'Please complete all required fields.';
    return;
  }

  const subject = `Project inquiry — ${name}`;
  const body = [
    'Hello, I would like to discuss a project.',
    '',
    `Name: ${name}`,
    `Email: ${email}`,
    `Project type: ${projectType}`,
    `Estimated budget: ${budget}`,
    '',
    'Project details:',
    details
  ].join('\n');

  if (CONTACT_EMAIL === 'gorospeazi@gmail.com') {
    formMessage.textContent = 'Before publishing, update CONTACT_EMAIL in script.js and the email shown on the page.';
    return;
  }

  const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailto;
  formMessage.textContent = 'Your email app should open with the inquiry prepared. Review it and send when ready.';
});
window.addEventListener("load", () => {
    window.scrollTo({
        left: 0,
        top: window.scrollY,
        behavior: "instant"
    });
});