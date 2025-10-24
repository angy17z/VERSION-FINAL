// ============================================
// SISTEMA DE ALMACENAMIENTO CON LOCALSTORAGE
// ============================================

let appData = {
    courses: [],
    students: [],
    subjects: [], // Ahora es una lista global de materias
    courseSubjects: {}, // Mapeo de cursos a materias
    grades: {},
    attendance: {},
    schoolInfo: {}
};

let currentUser = null;
let currentCourse = null;
let currentStudent = null;
let editingStudent = null;
let editingCourse = null;
let editingSubject = null; // Para editar materias globales

// Funciones de almacenamiento con LocalStorage
function saveData() {
    localStorage.setItem('schoolData', JSON.stringify(appData));
    console.log('Datos guardados en LocalStorage');
}

function loadData() {
    const data = localStorage.getItem('schoolData');
    console.log('Data from localStorage:', data);
    if (data) {
        const loadedData = JSON.parse(data);
        // Migración de datos si es necesario
        if (loadedData.subjects && !Array.isArray(loadedData.subjects)) {
            const migratedData = migrateOldData(loadedData);
            appData = migratedData;
        } else {
            appData = loadedData;
        }

        if (!appData.attendance || !Array.isArray(appData.attendance)) {
            appData.attendance = [];
        }
        if (!appData.subjects) {
            appData.subjects = [];
        }
        if (!appData.courseSubjects) {
            appData.courseSubjects = {};
        }
        if (!appData.schoolInfo) {
            appData.schoolInfo = {
                name: 'E.P.E.T. N°7',
                address: 'Colombia y Peru s/n',
                locality: 'Jardín America',
                year: new Date().getFullYear()
            };
        }

    } else {
        // Datos de demostración iniciales
        appData.courses = [
            { id: '1', name: '1° Año A' },
            { id: '2', name: '2° Año B' }
        ];
        appData.students = [
            { id: '1', name: 'Juan Pérez', dni: '12345678', courseId: '1' },
            { id: '2', name: 'María García', dni: '87654321', courseId: '1' }
        ];
        appData.subjects = [
            { id: '1', name: 'Matemática' },
            { id: '2', name: 'Lengua' },
            { id: '3', name: 'Historia' },
            { id: '4', name: 'Física' },
            { id: '5', name: 'Química' }
        ];
        appData.courseSubjects = {
            '1': ['1', '2', '3'],
            '2': ['1', '4', '5']
        };
        appData.grades = {
            '1': {
                'Matemática': { t1: 8, t2: 7, t3: 9 },
                'Lengua': { t1: 9, t2: 8, t3: 9 },
                'Historia': { t1: 7, t2: 8, t3: 8 }
            },
            '2': {
                'Matemática': { t1: 6, t2: 7, t3: 8 },
                'Física': { t1: 8, t2: 7, t3: 7 },
                'Química': { t1: 9, t2: 9, t3: 8 }
            }
        };
        appData.attendance = [];
        appData.schoolInfo = {
            name: 'E.P.E.T. N°7',
            address: 'Colombia y Peru s/n',
            locality: 'Jardín America',
            year: new Date().getFullYear()
        };
        saveData();
    }
}

function migrateOldData(oldData) {
    const newSubjects = [];
    const newCourseSubjects = {};
    let subjectIdCounter = 1;

    for (const courseId in oldData.subjects) {
        newCourseSubjects[courseId] = [];
        oldData.subjects[courseId].forEach(subjectName => {
            let subject = newSubjects.find(s => s.name === subjectName);
            if (!subject) {
                subject = { id: subjectIdCounter.toString(), name: subjectName };
                newSubjects.push(subject);
                subjectIdCounter++;
            }
            newCourseSubjects[courseId].push(subject.id);
        });
    }

    return {
        ...oldData,
        subjects: newSubjects,
        courseSubjects: newCourseSubjects
    };
}

// ============================================
// CARGA DE CONTENIDO DINÁMICO
// ============================================

async function loadContent(template, containerId) {
    const container = document.getElementById(containerId);
    const templateElement = document.getElementById(`template-${template}`);

    if (templateElement) {
        const content = document.importNode(templateElement.content, true);
        container.innerHTML = ''; // Clear existing content
        container.appendChild(content);
    } else {
        console.error(`Template 'template-${template}' not found.`);
        container.innerHTML = `<p>Error al cargar el contenido. Plantilla '${template}' no encontrada.</p>`;
    }
}

// ============================================
// FUNCIONES DE LOGIN
// ============================================

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.login-form').forEach(form => form.classList.remove('active'));
    
    if (tab === 'admin') {
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
        document.getElementById('adminLogin').classList.add('active');
    } else {
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
        document.getElementById('studentLogin').classList.add('active');
    }
}

function capitalizeName() {
    const nameInput = document.getElementById('studentName');
    const words = nameInput.value.split(' ');
    const capitalizedWords = words.map(word => {
        if (word.length > 0) {
            return word.charAt(0).toUpperCase() + word.slice(1);
        }
        return '';
    });
    nameInput.value = capitalizedWords.join(' ');
}

async function loginAdmin() {
    const userInput = document.getElementById('adminUser').value.trim().toLowerCase();
    const password = document.getElementById('adminPassword').value;
    const errorMsg = document.getElementById('adminError');

    // Normalize user input to remove accents for role mapping
    const normalizedUser = userInput.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const validRoles = ['general', 'ciclo1', 'informatica', 'electromecanica', 'automotores'];
    
    if (password === '1234' && validRoles.includes(normalizedUser)) {
        currentUser = { type: 'admin', role: normalizedUser };
        await loadContent('admin', 'main-container');
        document.getElementById('adminScreen').classList.add('active');
        showAdminSection('dashboard');
        
        let displayRole = normalizedUser;
        if (normalizedUser === 'informatica') displayRole = 'Informática';
        if (normalizedUser === 'electromecanica') displayRole = 'Electromecánica';

        if (normalizedUser !== 'general') {
            document.getElementById('admin-title').textContent = `Administrador (${displayRole})`;
        }
    } else {
        errorMsg.textContent = 'Usuario o contraseña incorrecta';
        errorMsg.classList.add('show');
    }
}

async function loginStudent() {
    const nameInput = document.getElementById('studentName').value.trim().toLowerCase().replace(/,/g, '');
    const dniInput = document.getElementById('studentDNI').value.trim().replace(/\./g, '');
    const errorMsg = document.getElementById('studentError');
    
    if (!nameInput || !dniInput) {
        errorMsg.textContent = 'Por favor complete todos los campos';
        errorMsg.classList.add('show');
        return;
    }
    
    const nameWords = nameInput.split(' ').filter(w => w);

    const student = appData.students.find(s => {
        const studentName = s.name.toLowerCase().replace(/,/g, '');
        const studentDNI = s.dni.replace(/\./g, '');
        const studentNameWords = studentName.split(' ').filter(w => w);
        
        return nameWords.every(word => studentNameWords.includes(word)) && studentDNI === dniInput;
    });
    
    if (student) {
        currentUser = { type: 'student', studentId: student.id };
        currentStudent = student;
        
        await loadContent('student', 'main-container');
        document.getElementById('studentScreen').classList.add('active');
        showStudentSection('inicio');
    } else {
        errorMsg.textContent = 'Alumno no registrado. Contacte al administrador.';
        errorMsg.classList.add('show');
    }
}

async function logout() {
    currentUser = null;
    currentStudent = null;
    await loadContent('login', 'main-container');
}

// ============================================
// FUNCIONES ADMINISTRADOR
// ============================================

function showAdminSection(section) {
    document.querySelectorAll('#adminScreen .top-nav-menu li').forEach(li => li.classList.remove('active'));
    document.querySelector(`#adminScreen .top-nav-menu li[onclick="showAdminSection('${section}')"]`).classList.add('active');
    
    const content = document.getElementById('adminContent');
    
    if (section === 'dashboard') {
        let totalCourses = appData.courses.length;
        let totalStudents = appData.students.length;
        let coursesLabel = 'Total Cursos';
        let studentsLabel = 'Total Alumnos';

        if (currentUser.role === 'ciclo1') {
            const firstCycleCourses = appData.courses.filter(course => parseInt(course.name, 10) <= 2);
            const firstCycleCourseIds = firstCycleCourses.map(c => c.id);
            totalCourses = firstCycleCourses.length;
            totalStudents = appData.students.filter(s => firstCycleCourseIds.includes(s.courseId)).length;
            coursesLabel = 'Total Cursos (Primer Ciclo)';
            studentsLabel = 'Total Alumnos (Primer Ciclo)';
        } else if (currentUser.role === 'electromecanica') {
            const orientationCourses = appData.courses.filter(course => parseInt(course.name, 10) > 2 && course.name.split(' ')[1] === 'A');
            const orientationCourseIds = orientationCourses.map(c => c.id);
            totalCourses = orientationCourses.length;
            totalStudents = appData.students.filter(s => orientationCourseIds.includes(s.courseId)).length;
            coursesLabel = 'Total Cursos (Electromecánica)';
            studentsLabel = 'Total Alumnos (Electromecánica)';
        } else if (currentUser.role === 'informatica') {
            const orientationCourses = appData.courses.filter(course => parseInt(course.name, 10) > 2 && course.name.split(' ')[1] === 'B');
            const orientationCourseIds = orientationCourses.map(c => c.id);
            totalCourses = orientationCourses.length;
            totalStudents = appData.students.filter(s => orientationCourseIds.includes(s.courseId)).length;
            coursesLabel = 'Total Cursos (Informática)';
            studentsLabel = 'Total Alumnos (Informática)';
        } else if (currentUser.role === 'automotores') {
            const orientationCourses = appData.courses.filter(course => parseInt(course.name, 10) > 2 && course.name.split(' ')[1] === 'C');
            const orientationCourseIds = orientationCourses.map(c => c.id);
            totalCourses = orientationCourses.length;
            totalStudents = appData.students.filter(s => orientationCourseIds.includes(s.courseId)).length;
            coursesLabel = 'Total Cursos (Automotores)';
            studentsLabel = 'Total Alumnos (Automotores)';
        }


        const totalSubjects = appData.subjects.length;
        const subjectsLabel = currentUser.role === 'general' ? 'Materias' : 'Materias (General)';
        content.innerHTML = `
            <div class="content-header">
                <h2>Inicio</h2>
            </div>
            <div class="card info-card" style="position: relative;">
                <div class="card-header-btn">
                    <button class="btn btn-sm btn-warning" onclick="openEditYearModal()">Editar</button>
                </div>
                <h3>${'Información de la Escuela'.toUpperCase()}</h3>
                <p><strong>Nombre:</strong> ${appData.schoolInfo.name}</p>
                <p><strong>Dirección:</strong> ${appData.schoolInfo.address}</p>
                <p><strong>Localidad:</strong> ${appData.schoolInfo.locality}</p>
                <p><strong>Año:</strong> ${appData.schoolInfo.year}</p>
            </div>
            <div class="stats-grid">
                <div class="stat-card">
                    <h4>${coursesLabel}</h4>
                    <p>${totalCourses}</p>
                </div>
                <div class="stat-card">
                    <h4>${studentsLabel}</h4>
                    <p>${totalStudents}</p>
                </div>
                <div class="stat-card">
                    <h4>${subjectsLabel}</h4>
                    <p>${totalSubjects}</p>
                </div>
            </div>
            <div class="card">
                <h3>Resumen del Sistema</h3>
                <p>Bienvenido al panel de administración. Desde aquí puedes gestionar cursos, materias y alumnos.</p>
                <p style="margin-top: 10px;"><strong>Nota:</strong> Todos los datos se guardan automáticamente en LocalStorage.</p>
            </div>
        `;
    } else if (section === 'courses') {
        showCoursesSection();
    } else if (section === 'students') {
        showStudentsSection();
    } else if (section === 'subjects') {
        showSubjectsSection();
    }
}

function showSubjectsSection() {
    const content = document.getElementById('adminContent');
    
    let html = `
        <div class="content-header">
            <h2>Gestión de Materias</h2>
            <div class="search-bar">
                <input type="text" id="subjectSearch" oninput="searchSubjects()" placeholder="Buscar materias...">
            </div>
            <button class="btn btn-secondary" onclick="openSubjectModal()">+ Nueva Materia</button>
        </div>
        <div id="subjects-container"></div>
    `;
    
    content.innerHTML = html;
    renderSubjects();
}

function renderSubjects(filter = '') {
    const subjectsContainer = document.getElementById('subjects-container');
    const filteredSubjects = appData.subjects.filter(subject => subject.name.toLowerCase().startsWith(filter.toLowerCase()));

    let html = `
        <div class="card">
            <table>
                <thead>
                    <tr>
                        <th>Nombre de la Materia</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
    `;

    if (filteredSubjects.length > 0) {
        filteredSubjects.sort((a, b) => a.name.localeCompare(b.name)).forEach(subject => {
            html += `
                <tr>
                    <td>${subject.name}</td>
                    <td>
                        <button class="btn btn-warning" onclick="editSubject('${subject.id}')">Editar</button>
                        <button class="btn btn-danger" onclick="removeSubject('${subject.id}')">Eliminar</button>
                    </td>
                </tr>
            `;
        });
    } else {
        html += '<tr><td colspan="2">No hay materias registradas.</td></tr>';
    }

    html += `
                </tbody>
            </table>
        </div>
    `;
    subjectsContainer.innerHTML = html;
}

function searchSubjects() {
    const filter = document.getElementById('subjectSearch').value;
    renderSubjects(filter);
}

function showCoursesSection() {
    const content = document.getElementById('adminContent');
    
    let html = `
        <div class="content-header">
            <h2>Gestión de Cursos</h2>
            <div class="search-bar">
                <input type="text" id="courseSearch" oninput="searchCourses()" placeholder="Buscar cursos...">
            </div>
            <button class="btn btn-secondary" onclick="openCourseModal()">+ Nuevo Curso</button>
        </div>
        <div id="courses-container"></div>
    `;
    
    content.innerHTML = html;
    renderCourses();
}

function renderCourses(filter = '') {
    const coursesContainer = document.getElementById('courses-container');
    let filteredCourses = appData.courses.filter(course => course.name.toLowerCase().includes(filter.toLowerCase()));

    // Filter courses based on user role
    if (currentUser.role === 'ciclo1') {
        filteredCourses = filteredCourses.filter(course => parseInt(course.name, 10) <= 2);
    } else if (currentUser.role === 'electromecanica') {
        filteredCourses = filteredCourses.filter(course => parseInt(course.name, 10) > 2 && course.name.split(' ')[1] === 'A');
    } else if (currentUser.role === 'informatica') {
        filteredCourses = filteredCourses.filter(course => parseInt(course.name, 10) > 2 && course.name.split(' ')[1] === 'B');
    } else if (currentUser.role === 'automotores') {
        filteredCourses = filteredCourses.filter(course => parseInt(course.name, 10) > 2 && course.name.split(' ')[1] === 'C');
    }

    const categorizedCourses = categorizeCourses(filteredCourses);

    let html = `
        <div class="card">
            <h3>Primer Ciclo</h3>
            <div class="course-list">
                ${renderCourseList(categorizedCourses.firstCycle)}
            </div>
        </div>

        <div class="card">
            <h3>Segundo Ciclo</h3>
            <h4>Electromecánica</h4>
            <div class="course-list">
                ${renderCourseList(categorizedCourses.secondCycle.electromecanica)}
            </div>
            <h4>Informática</h4>
            <div class="course-list">
                ${renderCourseList(categorizedCourses.secondCycle.informatica)}
            </div>
            <h4>Automotores</h4>
            <div class="course-list">
                ${renderCourseList(categorizedCourses.secondCycle.automotores)}
            </div>
        </div>
    `;

    if (currentUser.role === 'ciclo1') {
        html = `
        <div class="card">
            <h3>Primer Ciclo</h3>
            <div class="course-list">
                ${renderCourseList(categorizedCourses.firstCycle)}
            </div>
        </div>
        `;
    } else if (currentUser.role === 'electromecanica') {
        html = `
        <div class="card">
            <h3>Segundo Ciclo</h3>
            <h4>Electromecánica</h4>
            <div class="course-list">
                ${renderCourseList(categorizedCourses.secondCycle.electromecanica)}
            </div>
        </div>
        `;
    } else if (currentUser.role === 'informatica') {
        html = `
        <div class="card">
            <h3>Segundo Ciclo</h3>
            <h4>Informática</h4>
            <div class="course-list">
                ${renderCourseList(categorizedCourses.secondCycle.informatica)}
            </div>
        </div>
        `;
    } else if (currentUser.role === 'automotores') {
        html = `
        <div class="card">
            <h3>Segundo Ciclo</h3>
            <h4>Automotores</h4>
            <div class="course-list">
                ${renderCourseList(categorizedCourses.secondCycle.automotores)}
            </div>
        </div>
        `;
    }

    coursesContainer.innerHTML = html;
}

function searchCourses() {
    const filter = document.getElementById('courseSearch').value;
    renderCourses(filter);
}

function categorizeCourses(courses) {
    const categorized = {
        firstCycle: [],
        secondCycle: {
            electromecanica: [],
            informatica: [],
            automotores: []
        }
    };

    courses.forEach(course => {
        const year = parseInt(course.name, 10);
        const division = course.name.split(' ')[1];

        if (year <= 2) {
            categorized.firstCycle.push(course);
        } else {
            if (division === 'A') {
                categorized.secondCycle.electromecanica.push(course);
            } else if (division === 'B') {
                categorized.secondCycle.informatica.push(course);
            } else if (division === 'C') {
                categorized.secondCycle.automotores.push(course);
            }
        }
    });

    return categorized;
}

function renderCourseList(courses) {
    let courseHtml = '';
    if (courses.length > 0) {
        courses.sort((a, b) => a.name.localeCompare(b.name)).forEach(course => {
            courseHtml += `
                <div class="course-card" onclick="showCourseDetail('${course.id}')">
                    <h4>${course.name}</h4>
                </div>
            `;
        });
    } else {
        courseHtml = '<p>No hay cursos en esta categoría.</p>';
    }
    return courseHtml;
}

function showCourseDetail(courseId) {
    currentCourse = appData.courses.find(c => c.id === courseId);

    // Role check
    if (currentUser.role !== 'general') {
        const courseYear = parseInt(currentCourse.name, 10);
        const courseDivision = currentCourse.name.split(' ')[1];
        if (currentUser.role === 'ciclo1' && courseYear > 2) {
            showCoursesSection();
            return;
        }
        if (currentUser.role === 'electromecanica' && (courseYear <= 2 || courseDivision !== 'A')) {
            showCoursesSection();
            return;
        }
        if (currentUser.role === 'informatica' && (courseYear <= 2 || courseDivision !== 'B')) {
            showCoursesSection();
            return;
        }
        if (currentUser.role === 'automotores' && (courseYear <= 2 || courseDivision !== 'C')) {
            showCoursesSection();
            return;
        }
    }

    const content = document.getElementById('adminContent');
    const subjectIds = appData.courseSubjects[courseId] || [];
    const subjects = subjectIds.map(id => appData.subjects.find(s => s.id === id)).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name));
    const courseStudents = appData.students.filter(s => s.courseId === courseId).sort((a, b) => a.name.localeCompare(b.name));
    
    let html = `
        <div class="content-header">
            <h2>${currentCourse.name}</h2>
            <div class="btn-group">
                <button class="btn btn-warning" onclick="editCourse('${courseId}')">Editar Curso</button>
                <button class="btn btn-secondary" onclick="openSubjectToCourseModal('${courseId}')">+ Agregar Materia</button>
                <button class="btn btn-secondary" onclick="openStudentModal('${courseId}')">+ Nuevo Alumno</button>
                <button class="btn btn-secondary" onclick="openStudentToCourseModal('${courseId}')">+ Agregar Alumno Existente</button>
                <button class="btn btn-danger" onclick="openRemoveStudentFromCourseModal('${courseId}')">- Quitar Alumno</button>
                <button class="btn btn-secondary" onclick="openCourseAttendanceModal('${courseId}')">Tomar Asistencia</button>
                <button class="btn btn-edit" onclick="showCoursesSection()">← Volver</button>
                <button class="btn btn-danger" onclick="removeCourse('${courseId}')">Eliminar Curso</button>
            </div>
        </div>
        <div class="card">
            <h3>Materias del Curso</h3>
    `;
    
    if (subjects.length > 0) {
        html += `
            <table>
                <thead>
                    <tr>
                        <th>Materia</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        subjects.forEach(subject => {
            html += `
                <tr>
                    <td>${subject.name}</td>
                    <td>
                        <button class="btn btn-danger" onclick="removeSubjectFromCourse('${subject.id}')">Quitar</button>
                    </td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
        `;
    } else {
        html += '<p>No hay materias registradas para este curso.</p>';
    }
    
    html += '</div><div class="card"><h3>Alumnos del Curso</h3>';
    
    if (courseStudents.length > 0) {
        html += '<div class="student-list">';
        courseStudents.forEach(student => {
            html += `
                <div class="student-card" onclick="showStudentDetail('${student.id}')">
                    <h4>${student.name}</h4>
                    <p>📋 DNI: ${student.dni}</p>
                </div>
            `;
        });
        html += '</div>';
    } else {
        html += '<p>No hay alumnos registrados en este curso.</p>';
    }
    
    html += '</div>';
    content.innerHTML = html;
}

function showStudentsSection() {
    const content = document.getElementById('adminContent');
    
    let html = `
        <div class="content-header">
            <h2>Gestión de Alumnos</h2>
            <div class="search-bar">
                <input type="text" id="studentSearch" oninput="searchStudents()" placeholder="Buscar alumnos...">
            </div>
            <button class="btn btn-secondary" onclick="openStudentModal()">+ Nuevo Alumno</button>
        </div>
        <div id="students-container"></div>
    `;
    
    content.innerHTML = html;
    renderStudents();
}

function renderStudents(filter = '') {
    const studentsContainer = document.getElementById('students-container');
    let filteredStudents = appData.students.filter(student => student.name.toLowerCase().includes(filter.toLowerCase()));

    // Filter students based on user role
    if (currentUser.role !== 'general') {
        let allowedCourseIds = [];
        if (currentUser.role === 'ciclo1') {
            allowedCourseIds = appData.courses.filter(course => parseInt(course.name, 10) <= 2).map(c => c.id);
        } else if (currentUser.role === 'electromecanica') {
            allowedCourseIds = appData.courses.filter(course => parseInt(course.name, 10) > 2 && course.name.split(' ')[1] === 'A').map(c => c.id);
        } else if (currentUser.role === 'informatica') {
            allowedCourseIds = appData.courses.filter(course => parseInt(course.name, 10) > 2 && course.name.split(' ')[1] === 'B').map(c => c.id);
        } else if (currentUser.role === 'automotores') {
            allowedCourseIds = appData.courses.filter(course => parseInt(course.name, 10) > 2 && course.name.split(' ')[1] === 'C').map(c => c.id);
        }
        filteredStudents = filteredStudents.filter(student => allowedCourseIds.includes(student.courseId));
    }


    let html = '';
    if (filteredStudents.length > 0) {
        html += '<div class="student-list">';
        filteredStudents.sort((a, b) => a.name.localeCompare(b.name)).forEach(student => {
            html += `
                <div class="student-card" onclick="showStudentDetail('${student.id}')">
                    <h4>${student.name}</h4>
                </div>
            `;
        });
        html += '</div>';
    } else {
        html += '<div class="card"><p>No hay alumnos registrados.</p></div>';
    }
    
    studentsContainer.innerHTML = html;
}

function searchStudents() {
    const filter = document.getElementById('studentSearch').value;
    renderStudents(filter);
}

function showStudentDetail(studentId) {
    try {
        console.log('showStudentDetail called with studentId:', studentId);
        currentStudent = appData.students.find(s => s.id === studentId);
        const course = appData.courses.find(c => c.id === currentStudent.courseId);

        // Role check
        if (currentUser.role !== 'general') {
            const courseYear = parseInt(course.name, 10);
            const courseDivision = course.name.split(' ')[1];
            if (currentUser.role === 'ciclo1' && courseYear > 2) {
                showStudentsSection();
                return;
            }
            if (currentUser.role === 'electromecanica' && (courseYear <= 2 || courseDivision !== 'A')) {
                showStudentsSection();
                return;
            }
            if (currentUser.role === 'informatica' && (courseYear <= 2 || courseDivision !== 'B')) {
                showStudentsSection();
                return;
            }
            if (currentUser.role === 'automotores' && (courseYear <= 2 || courseDivision !== 'C')) {
                showStudentsSection();
                return;
            }
        }

        const subjectIds = currentStudent.courseId ? appData.courseSubjects[currentStudent.courseId] || [] : [];
        const subjects = subjectIds.map(id => appData.subjects.find(s => s.id === id)).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name));
        const grades = appData.grades[studentId] || {};
        const attendance = calculateStudentAttendance(studentId);
        
        const content = document.getElementById('adminContent');
        let html = `
            <div class="content-header">
                <h2>${currentStudent.name}</h2>
                <div class="btn-group">
                    <button class="btn btn-warning" onclick="editStudent('${studentId}')">Editar Alumno</button>
                    <div class="tooltip-container">
                        <button class="btn btn-secondary" onclick="openGradesModal('${studentId}')" ${!currentStudent.courseId ? 'disabled' : ''}>Cargar Notas</button>
                        ${!currentStudent.courseId ? '<div class="tooltip">No se pueden cargar notas para un alumno sin curso.</div>' : ''}
                    </div>
                    <button class="btn btn-edit" onclick="showStudentsSection()">← Volver</button>
                    <button class="btn btn-danger" onclick="removeStudent('${studentId}')">Eliminar</button>
                </div>
            </div>
            <div class="card">
                <h3>Información Personal</h3>
                <p><strong>DNI:</strong> ${formatDNI(currentStudent.dni)}</p>
                <p><strong>Curso:</strong> ${course ? course.name : 'Sin curso'}</p>
                <p><strong>Asistencias:</strong> ${attendance.present} días</p>
                <p><strong>Inasistencias:</strong> ${attendance.absent} días</p>
            </div>
            <div class="card">
                <h3>Notas por Materia</h3>
        `;
        
        if (subjects.length > 0 && currentStudent.courseId) {
            html += `
                <table>
                    <thead>
                        <tr>
                            <th>Materia</th>
                            <th>Trimestre 1</th>
                            <th>Trimestre 2</th>
                            <th>Trimestre 3</th>
                            <th>Promedio</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            subjects.forEach(subject => {
                const subjectGrades = grades[subject.name] || {};
                const t1 = subjectGrades.t1 || '-';
                const t2 = subjectGrades.t2 || '-';
                const t3 = subjectGrades.t3 || '-';
                
                let average = '-';
                if (subjectGrades.t1 && subjectGrades.t2 && subjectGrades.t3) {
                    average = ((subjectGrades.t1 + subjectGrades.t2 + subjectGrades.t3) / 3).toFixed(2);
                }
                
                html += `
                    <tr>
                        <td>${subject.name}</td>
                        <td>${t1}</td>
                        <td>${t2}</td>
                        <td>${t3}</td>
                        <td><strong>${average}</strong></td>
                    </tr>
                `;
            });
            
            html += `
                    </tbody>
                </table>
            `;
        } else {
            html += '<p>No hay materias registradas para el curso de este alumno.</p>';
        }
        
        html += '</div>';
        content.innerHTML = html;
    } catch (error) {
        console.error('Error in showStudentDetail:', error);
    }
}

// ============================================
// FUNCIONES ALUMNO
// ============================================

function getSpecialization(division) {
    if (division === 'A') return 'Electromecánica';
    if (division === 'B') return 'Informática';
    if (division === 'C') return 'Automotores';
    return '';
}

function formatDNI(dni) {
    if (!dni) return '';
    let dniStr = String(dni).replace(/\./g, '');
    dniStr = dniStr.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    return dniStr;
}

function showStudentSection(section) {
    document.querySelectorAll('#studentScreen .top-nav-menu li').forEach(li => li.classList.remove('active'));
    document.querySelector(`#studentScreen .top-nav-menu li[onclick="showStudentSection('${section}')"]`).classList.add('active');
    
    const content = document.getElementById('studentContent');
    const studentId = currentStudent.id;
    const courseId = currentStudent.courseId;
    const course = appData.courses.find(c => c.id === courseId);
    const subjectIds = appData.courseSubjects[courseId] || [];
    const subjects = subjectIds.map(id => appData.subjects.find(s => s.id === id)).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name));
    const grades = appData.grades[studentId] || {};
    const attendance = calculateStudentAttendance(studentId);
    
    let html = '';

    if (section === 'inicio') {
        const year = course ? parseInt(course.name, 10) : '';
        const division = course ? course.name.split(' ')[1] : '';
        const specialization = year > 2 ? getSpecialization(division) : '';

        html = `
            <div class="card info-card">
                <h3>${'Información de la Escuela'.toUpperCase()}</h3>
                <p><strong>Nombre:</strong> ${appData.schoolInfo.name}</p>
                <p><strong>Dirección:</strong> ${appData.schoolInfo.address}</p>
                <p><strong>Localidad:</strong> ${appData.schoolInfo.locality}</p>
            </div>
            <div class="card info-card">
                <h3>${'Información del Alumno'.toUpperCase()}</h3>
                <p><strong>Nombre:</strong> ${currentStudent.name}</p>
                <p><strong>DNI:</strong> ${formatDNI(currentStudent.dni)}</p>
                <p><strong>Curso:</strong> ${course ? course.name : 'Sin curso'} ${specialization ? `(${specialization})` : ''}</p>
                <p><strong>Año:</strong> ${appData.schoolInfo.year}</p>
            </div>
        `;
    } else if (section === 'grades') {
        html = `
            <div class="content-header">
                <h2>Mis Notas</h2>
            </div>
            <div class="card">
                <h3>Calificaciones por Materia</h3>
        `;
        
        if (subjects.length > 0) {
            html += `
                <table>
                    <thead>
                        <tr>
                            <th>Materia</th>
                            <th>Trimestre 1</th>
                            <th>Trimestre 2</th>
                            <th>Trimestre 3</th>
                            <th>Promedio</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            subjects.forEach(subject => {
                const subjectGrades = grades[subject.name] || {};
                const t1 = subjectGrades.t1 || '-';
                const t2 = subjectGrades.t2 || '-';
                const t3 = subjectGrades.t3 || '-';
                
                let average = '-';
                if (subjectGrades.t1 && subjectGrades.t2 && subjectGrades.t3) {
                    average = ((subjectGrades.t1 + subjectGrades.t2 + subjectGrades.t3) / 3).toFixed(2);
                }
                
                html += `
                    <tr>
                        <td>${subject.name}</td>
                        <td>${t1}</td>
                        <td>${t2}</td>
                        <td>${t3}</td>
                        <td><strong>${average}</strong></td>
                    </tr>
                `;
            });
            
            html += `
                    </tbody>
                </table>
            `;
        } else {
            html += '<p>No hay materias registradas para tu curso.</p>';
        }
        
        html += '</div>';
    } else if (section === 'attendance') {
        html = `
            <div class="content-header">
                <h2>Mis Asistencias</h2>
            </div>
            <div class="card info-card">
                <h3>Total de Asistencias</h3>
                <p><strong>Presente:</strong> ${attendance.present} días</p>
                <p><strong>Ausente:</strong> ${attendance.absent} días</p>
            </div>
        `;
    } else if (section === 'average') {
        const averages = calculateStudentAverages(studentId);
        
        html = `
            <div class="content-header">
                <h2>Mis Promedios</h2>
            </div>
            <div class="card">
                <h3>Promedio General: <span style="color: #4b5563; font-size: 2em;">${averages.general}</span></h3>
            </div>
            <div class="card">
                <h3>Promedios por Trimestre</h3>
                <div class="stats-grid">
                    <div class="stat-card">
                        <h4>Trimestre 1</h4>
                        <p>${averages.t1}</p>
                    </div>
                    <div class="stat-card">
                        <h4>Trimestre 2</h4>
                        <p>${averages.t2}</p>
                    </div>
                    <div class="stat-card">
                        <h4>Trimestre 3</h4>
                        <p>${averages.t3}</p>
                    </div>
                </div>
            </div>
        `;
    }
    content.innerHTML = html;
}

function calculateAttendancePercentage(attendance) {
    const total = attendance.present + attendance.absent;
    if (total === 0) return 0;
    return ((attendance.present / total) * 100).toFixed(1);
}

function calculateStudentAverages(studentId) {
    const grades = appData.grades[studentId] || {};
    let t1Sum = 0, t2Sum = 0, t3Sum = 0;
    let t1Count = 0, t2Count = 0, t3Count = 0;
    
    Object.values(grades).forEach(subjectGrades => {
        if (subjectGrades.t1) { t1Sum += subjectGrades.t1; t1Count++; }
        if (subjectGrades.t2) { t2Sum += subjectGrades.t2; t2Count++; }
        if (subjectGrades.t3) { t3Sum += subjectGrades.t3; t3Count++; }
    });
    
    const avgT1 = t1Count > 0 ? (t1Sum / t1Count).toFixed(2) : '-';
    const avgT2 = t2Count > 0 ? (t2Sum / t2Count).toFixed(2) : '-';
    const avgT3 = t3Count > 0 ? (t3Sum / t3Count).toFixed(2) : '-';
    
    let generalAvg = '-';
    if (t1Count > 0 && t2Count > 0 && t3Count > 0) {
        generalAvg = ((parseFloat(avgT1) + parseFloat(avgT2) + parseFloat(avgT3)) / 3).toFixed(2);
    }
    
    return {
        t1: avgT1,
        t2: avgT2,
        t3: avgT3,
        general: generalAvg
    };
}

function generateStudentCalendar(studentId, month, year) {
    const calendarContainer = document.getElementById('attendance-calendar');
    const studentAttendance = appData.attendance.filter(a => a.present.includes(studentId) || a.absent.includes(studentId));
    
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    let html = `
        <div class="calendar-header">
            <button onclick="generateStudentCalendar('${studentId}', ${month - 1}, ${year})">‹</button>
            <h3>${monthNames[month]} ${year}</h3>
            <button onclick="generateStudentCalendar('${studentId}', ${month + 1}, ${year})">›</button>
        </div>
        <div class="calendar-grid">
    `;
    
    daysOfWeek.forEach(day => {
        html += `<div class="calendar-day-name">${day}</div>`;
    });
    
    for (let i = 0; i < firstDay.getDay(); i++) {
        html += '<div></div>';
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
        const date = new Date(year, month, i);
        const dateString = date.toISOString().split('T')[0];
        const dayOfWeek = date.getDay();
        
        let attendanceClass = '';
        let tooltipText = '';
        const attendanceRecords = studentAttendance.filter(a => a.date === dateString);
        
        if (attendanceRecords.length > 0) {
            let present = false;
            let absent = false;
            let morning = false;
            let afternoon = false;

            attendanceRecords.forEach(record => {
                if (record.present.includes(studentId)) {
                    present = true;
                    if (record.shift === 'morning') morning = true;
                    if (record.shift === 'afternoon') afternoon = true;
                    if (record.shift === 'both') {
                        morning = true;
                        afternoon = true;
                    }
                }
                if (record.absent.includes(studentId)) {
                    absent = true;
                }
            });

            if (morning && afternoon) {
                attendanceClass = 'present';
                tooltipText = 'Presente (Ambos turnos)';
            } else if (morning) {
                attendanceClass = 'half-day';
                tooltipText = 'Presente (Turno mañana)';
            } else if (afternoon) {
                attendanceClass = 'half-day';
                tooltipText = 'Presente (Turno tarde)';
            } else if (absent) {
                attendanceClass = 'absent';
                tooltipText = 'Ausente';
            }
        }

        if (dayOfWeek === 0 || dayOfWeek === 6) {
            html += `<div class="calendar-day weekend">${i}</div>`;
        } else {
            html += `<div class="calendar-day ${attendanceClass}" data-tooltip="${tooltipText}">${i}</div>`;
        }
    }
    
    html += '</div>';
    calendarContainer.innerHTML = html;
}

// ============================================
// FUNCIONES DE MODALES Y CRUD
// ============================================

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function openCourseModal() {
    editingCourse = null;
    document.getElementById('courseModalTitle').textContent = 'Nuevo Curso';

    const yearSelect = document.getElementById('courseYear');
    yearSelect.innerHTML = '';
    let years = [1, 2, 3, 4, 5, 6];
    if (currentUser.role === 'ciclo1') {
        years = [1, 2];
    } else if (['electromecanica', 'informatica', 'automotores'].includes(currentUser.role)) {
        years = [3, 4, 5, 6];
    }

    for (const i of years) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `${i}°`;
        yearSelect.appendChild(option);
    }

    updateDivisionDropdown();
    openModal('courseModal');
}

function updateDivisionDropdown() {
    const year = document.getElementById('courseYear').value;
    const divisionSelect = document.getElementById('courseDivision');
    divisionSelect.innerHTML = '';

    let divisions = ['A', 'B', 'C', 'D', 'E'];
    if (year >= 3) {
        if (currentUser.role === 'electromecanica') {
            divisions = ['A'];
        } else if (currentUser.role === 'informatica') {
            divisions = ['B'];
        } else if (currentUser.role === 'automotores') {
            divisions = ['C'];
        } else if (currentUser.role === 'general') {
            divisions = ['A', 'B', 'C'];
        } else {
            divisions = []; // ciclo1 should not see divisions for year >= 3
        }
    }

    divisions.forEach(division => {
        const option = document.createElement('option');
        option.value = division;
        option.textContent = division;
        divisionSelect.appendChild(option);
    });
}

function saveCourse() {
    const year = document.getElementById('courseYear').value;
    const division = document.getElementById('courseDivision').value;
    const courseName = `${year}° ${division}`;

    // Role check
    if (currentUser.role !== 'general') {
        if (currentUser.role === 'ciclo1' && year > 2) {
            alert('No tiene permisos para crear cursos en el segundo ciclo.');
            return;
        }
        if (['electromecanica', 'informatica', 'automotores'].includes(currentUser.role)) {
            if (year <= 2) {
                alert('No tiene permisos para crear cursos en el primer ciclo.');
                return;
            }
            if (currentUser.role === 'electromecanica' && division !== 'A') {
                alert('No tiene permisos para crear cursos en otra orientación.');
                return;
            }
            if (currentUser.role === 'informatica' && division !== 'B') {
                alert('No tiene permisos para crear cursos en otra orientación.');
                return;
            }
            if (currentUser.role === 'automotores' && division !== 'C') {
                alert('No tiene permisos para crear cursos en otra orientación.');
                return;
            }
        }
    }

    if (appData.courses.some(course => course.name === courseName)) {
        alert('Este curso ya existe.');
        return;
    }

    if (editingCourse) {
        // This part is no longer used, but we keep it for now
        editingCourse.name = courseName;
        editingCourse = null;
    } else {
        const newCourse = {
            id: Date.now().toString(),
            name: courseName
        };
        appData.courses.push(newCourse);
        appData.courseSubjects[newCourse.id] = []; // Inicializar mapeo de materias
    }
    
    saveData();
    closeModal('courseModal');
    showCoursesSection();
}

function openSubjectModal() {
    editingSubject = null;
    document.getElementById('subjectModalTitle').textContent = 'Nueva Materia';
    document.getElementById('subjectName').value = '';
    openModal('subjectModal');
}

function editSubject(subjectId) {
    editingSubject = appData.subjects.find(s => s.id === subjectId);
    if (!editingSubject) return;

    document.getElementById('subjectModalTitle').textContent = 'Editar Materia';
    document.getElementById('subjectName').value = editingSubject.name;
    document.getElementById('subjectId').value = editingSubject.id;
    openModal('globalSubjectModal');
}

function saveSubject() {
    let subjectNameValue = document.getElementById('subjectName').value.trim();
    const subjectIdValue = document.getElementById('subjectId').value;

    if (!subjectNameValue) {
        alert('Por favor ingrese un nombre para la materia');
        return;
    }

    // Capitalize the first letter of each word
    subjectNameValue = subjectNameValue.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');

    // Normalize subject names for accent-insensitive comparison
    const normalizedNewSubjectName = subjectNameValue.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

    if (appData.subjects.some(subject => {
        const normalizedExistingSubjectName = subject.name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
        return normalizedExistingSubjectName === normalizedNewSubjectName && subject.id !== subjectIdValue;
    })) {
        alert('Esta materia ya existe.');
        return;
    }

    if (subjectIdValue) {
        // Editar materia existente
        const subject = appData.subjects.find(s => s.id === subjectIdValue);
        if (subject) {
            subject.name = subjectNameValue;
        }
    } else {
        // Crear nueva materia
        const newSubject = {
            id: Date.now().toString(),
            name: subjectNameValue
        };
        appData.subjects.push(newSubject);
    }

    saveData();
    closeModal('subjectModal');
    showSubjectsSection();
}

function removeSubject(subjectId) {
    if (confirm('¿Está seguro de eliminar esta materia? Se eliminará de todos los cursos.')) {
        // Eliminar la materia de la lista global
        appData.subjects = appData.subjects.filter(s => s.id !== subjectId);

        // Eliminar la materia de todos los cursos
        for (const courseId in appData.courseSubjects) {
            appData.courseSubjects[courseId] = appData.courseSubjects[courseId].filter(id => id !== subjectId);
        }

        saveData();
        showSubjectsSection();
    }
}

function openSubjectToCourseModal(courseId) {
    currentCourse = appData.courses.find(c => c.id === courseId);
    const select = document.getElementById('subjectToCourse');
    select.innerHTML = '<option value="">Seleccione una materia</option>';

    const courseSubjectIds = appData.courseSubjects[courseId] || [];
    const availableSubjects = appData.subjects.filter(s => !courseSubjectIds.includes(s.id)).sort((a, b) => a.name.localeCompare(b.name));

    availableSubjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject.id;
        option.textContent = subject.name;
        select.appendChild(option);
    });

    openModal('subjectToCourseModal');
}

function saveSubjectToCourse() {
    const subjectId = document.getElementById('subjectToCourse').value;
    if (!subjectId) {
        alert('Por favor seleccione una materia');
        return;
    }

    if (!currentCourse) {
        alert('Error: No hay un curso seleccionado');
        return;
    }

    if (!appData.courseSubjects[currentCourse.id]) {
        appData.courseSubjects[currentCourse.id] = [];
    }

    if (appData.courseSubjects[currentCourse.id].includes(subjectId)) {
        alert('Esta materia ya está en el curso');
        return;
    }

    appData.courseSubjects[currentCourse.id].push(subjectId);
    saveData();

    closeModal('subjectToCourseModal');
    showCourseDetail(currentCourse.id);
}

function openStudentToCourseModal(courseId) {
    currentCourse = appData.courses.find(c => c.id === courseId);
    const select = document.getElementById('studentToCourse');
    select.innerHTML = '<option value="">Seleccione un alumno</option>';

    const allStudents = appData.students.sort((a, b) => a.name.localeCompare(b.name));

    allStudents.forEach(student => {
        const option = document.createElement('option');
        option.value = student.id;
        option.textContent = student.name;
        select.appendChild(option);
    });

    openModal('studentToCourseModal');
}

function saveStudentToCourse() {
    const studentId = document.getElementById('studentToCourse').value;
    if (!studentId) {
        alert('Por favor seleccione un alumno');
        return;
    }

    if (!currentCourse) {
        alert('Error: No hay un curso seleccionado');
        return;
    }

    const student = appData.students.find(s => s.id === studentId);
    if (student) {
        if (student.courseId) {
            const oldCourse = appData.courses.find(c => c.id === student.courseId);
            if (confirm(`El alumno ya está registrado en otro curso (${oldCourse.name}), desea cambiar de curso?`)) {
                student.courseId = currentCourse.id;
                saveData();
            } else {
                return;
            }
        } else {
            student.courseId = currentCourse.id;
            saveData();
        }

        closeModal('studentToCourseModal');
        showCourseDetail(currentCourse.id);
    }
}

function removeSubjectFromCourse(subjectId) {
    if (!currentCourse) return;

    if (confirm('¿Está seguro de quitar esta materia del curso?')) {
        const index = appData.courseSubjects[currentCourse.id].indexOf(subjectId);
        if (index > -1) {
            appData.courseSubjects[currentCourse.id].splice(index, 1);
            saveData();
            showCourseDetail(currentCourse.id);
        }
    }
}

function openRemoveStudentFromCourseModal(courseId) {
    currentCourse = appData.courses.find(c => c.id === courseId);
    const studentList = document.getElementById('studentsToRemoveList');
    const courseStudents = appData.students.filter(s => s.courseId === courseId);
    
    let html = '';
    courseStudents.forEach(student => {
        html += `
            <div>
                <input type="checkbox" id="student-to-remove-${student.id}" value="${student.id}">
                <label for="student-to-remove-${student.id}">${student.name}</label>
            </div>
        `;
    });
    
    studentList.innerHTML = html;
    openModal('removeStudentFromCourseModal');
}

function removeStudentsFromCourse() {
    const selectedStudentIds = Array.from(document.querySelectorAll('#studentsToRemoveList input[type=checkbox]:checked')).map(cb => cb.value);
    
    if (selectedStudentIds.length === 0) {
        alert('Por favor seleccione al menos un alumno');
        return;
    }

    if (confirm('¿Está seguro de quitar a los alumnos seleccionados del curso?')) {
        selectedStudentIds.forEach(studentId => {
            const student = appData.students.find(s => s.id === studentId);
            if (student) {
                student.courseId = null;
            }
        });
        saveData();
        closeModal('removeStudentFromCourseModal');
        showCourseDetail(currentCourse.id);
    }
}

function removeCourse(courseId) {
    const course = appData.courses.find(c => c.id === courseId);
    if (!course) return;

    // Role check
    if (currentUser.role !== 'general') {
        const courseYear = parseInt(course.name, 10);
        const courseDivision = course.name.split(' ')[1];
        if (currentUser.role === 'ciclo1' && courseYear > 2) {
            alert('No tiene permisos para eliminar cursos del segundo ciclo.');
            return;
        }
        if (['electromecanica', 'informatica', 'automotores'].includes(currentUser.role)) {
            if (courseYear <= 2) {
                alert('No tiene permisos para eliminar cursos del primer ciclo.');
                return;
            }
            if (currentUser.role === 'electromecanica' && courseDivision !== 'A') {
                alert('No tiene permisos para eliminar cursos de otra orientación.');
                return;
            }
            if (currentUser.role === 'informatica' && courseDivision !== 'B') {
                alert('No tiene permisos para eliminar cursos de otra orientación.');
                return;
            }
            if (currentUser.role === 'automotores' && courseDivision !== 'C') {
                alert('No tiene permisos para eliminar cursos de otra orientación.');
                return;
            }
        }
    }

    if (confirm('¿Está seguro de eliminar este curso? Se eliminarán todos los datos asociados.')) {
        appData.courses = appData.courses.filter(c => c.id !== courseId);
        delete appData.courseSubjects[courseId];
        appData.students = appData.students.filter(s => s.courseId !== courseId);
        saveData();
        showCoursesSection();
    }
}

function populateStudentDivisionSelect() {
    const year = document.getElementById('newStudentYear').value;
    const divisionSelect = document.getElementById('newStudentDivision');
    divisionSelect.innerHTML = '';

    if (year === 'sin-curso') {
        divisionSelect.disabled = true;
        return;
    }

    divisionSelect.disabled = false;
    let divisions = ['A', 'B', 'C', 'D', 'E'];
    if (year >= 3) {
        if (currentUser.role === 'electromecanica') {
            divisions = ['A'];
        } else if (currentUser.role === 'informatica') {
            divisions = ['B'];
        } else if (currentUser.role === 'automotores') {
            divisions = ['C'];
        } else if (currentUser.role === 'general') {
            divisions = ['A', 'B', 'C'];
        } else {
            divisions = []; // ciclo1 should not see divisions for year >= 3
        }
    }

    divisions.forEach(division => {
        const option = document.createElement('option');
        option.value = division;
        option.textContent = division;
        divisionSelect.appendChild(option);
    });
}

function openStudentModal(courseId) {
    editingStudent = null;
    document.getElementById('studentModalTitle').textContent = 'Nuevo Alumno';
    document.getElementById('newStudentName').value = '';
    document.getElementById('newStudentDNI').value = '';
    
    const yearSelect = document.getElementById('newStudentYear');
    yearSelect.innerHTML = '';
    let years = [1, 2, 3, 4, 5, 6];
    if (currentUser.role === 'ciclo1') {
        years = [1, 2];
    } else if (['electromecanica', 'informatica', 'automotores'].includes(currentUser.role)) {
        years = [3, 4, 5, 6];
    }

    const option = document.createElement('option');
    option.value = 'sin-curso';
    option.textContent = 'Sin curso';
    yearSelect.appendChild(option);

    for (const i of years) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `${i}°`;
        yearSelect.appendChild(option);
    }

    populateStudentDivisionSelect();
    openModal('studentModal');
}

function editStudent(studentId) {
    editingStudent = appData.students.find(s => s.id === studentId);
    const course = appData.courses.find(c => c.id === editingStudent.courseId);

    // Role check
    if (currentUser.role !== 'general' && course) {
        const courseYear = parseInt(course.name, 10);
        const courseDivision = course.name.split(' ')[1];
        if (currentUser.role === 'ciclo1' && courseYear > 2) {
            alert('No tiene permisos para editar alumnos del segundo ciclo.');
            showStudentsSection();
            return;
        }
        if (['electromecanica', 'informatica', 'automotores'].includes(currentUser.role)) {
            if (courseYear <= 2) {
                alert('No tiene permisos para editar alumnos del primer ciclo.');
                showStudentsSection();
                return;
            }
            if (currentUser.role === 'electromecanica' && courseDivision !== 'A') {
                alert('No tiene permisos para editar alumnos de otra orientación.');
                showStudentsSection();
                return;
            }
            if (currentUser.role === 'informatica' && courseDivision !== 'B') {
                alert('No tiene permisos para editar alumnos de otra orientación.');
                showStudentsSection();
                return;
            }
            if (currentUser.role === 'automotores' && courseDivision !== 'C') {
                alert('No tiene permisos para editar alumnos de otra orientación.');
                showStudentsSection();
                return;
            }
        }
    }

    document.getElementById('studentModalTitle').textContent = 'Editar Alumno';
    document.getElementById('newStudentName').value = editingStudent.name;
    document.getElementById('newStudentDNI').value = editingStudent.dni;
    
    const year = course ? parseInt(course.name, 10) : 'sin-curso';
    const division = course ? course.name.split(' ')[1] : '';

    const yearSelect = document.getElementById('newStudentYear');
    yearSelect.innerHTML = '';

    const option = document.createElement('option');
    option.value = 'sin-curso';
    option.textContent = 'Sin curso';
    yearSelect.appendChild(option);

    for (let i = 1; i <= 6; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `${i}°`;
        yearSelect.appendChild(option);
    }
    
    yearSelect.value = year;
    populateStudentDivisionSelect();
    document.getElementById('newStudentDivision').value = division;

    openModal('studentModal');
}

function saveStudent() {
    const name = document.getElementById('newStudentName').value.trim();
    const dni = document.getElementById('newStudentDNI').value.trim();
    const year = document.getElementById('newStudentYear').value;
    const division = document.getElementById('newStudentDivision').value;
    
    if (!name || !dni) {
        alert('Por favor complete todos los campos');
        return;
    }

    let courseId = null;
    if (year !== 'sin-curso') {
        if (!year || !division) {
            alert('Por favor complete todos los campos');
            return;
        }

        // Role check
        if (currentUser.role !== 'general') {
            if (currentUser.role === 'ciclo1' && year > 2) {
                alert('No tiene permisos para crear o mover alumnos al segundo ciclo.');
                return;
            }
            if (['electromecanica', 'informatica', 'automotores'].includes(currentUser.role)) {
                if (year <= 2) {
                    alert('No tiene permisos para crear o mover alumnos al primer ciclo.');
                    return;
                }
                if (currentUser.role === 'electromecanica' && division !== 'A') {
                    alert('No tiene permisos para crear o mover alumnos a otra orientación.');
                    return;
                }
                if (currentUser.role === 'informatica' && division !== 'B') {
                    alert('No tiene permisos para crear o mover alumnos a otra orientación.');
                    return;
                }
                if (currentUser.role === 'automotores' && division !== 'C') {
                    alert('No tiene permisos para crear o mover alumnos a otra orientación.');
                    return;
                }
            }
        }

        const courseName = `${year}° ${division}`;
        const course = appData.courses.find(c => c.name === courseName);
        if (!course) {
            alert('El curso seleccionado no existe');
            return;
        }
        courseId = course.id;
    }

    if (editingStudent) {
        // Editar alumno existente
        const existingWithDNI = appData.students.find(s => s.dni === dni && s.id !== editingStudent.id);
        if (existingWithDNI) {
            alert('Ya existe otro alumno con ese DNI');
            return;
        }
        
        editingStudent.name = name;
        editingStudent.dni = dni;
        editingStudent.courseId = courseId;
        editingStudent = null;
    } else {
        // Crear nuevo alumno
        const existingStudent = appData.students.find(s => s.dni === dni);
        if (existingStudent) {
            alert('Ya existe un alumno con ese DNI');
            return;
        }
        
        const newStudent = {
            id: Date.now().toString(),
            name: name,
            dni: dni,
            courseId: courseId
        };
        
        appData.students.push(newStudent);
        appData.grades[newStudent.id] = {};
    }
    
    saveData();
    closeModal('studentModal');
    document.getElementById('newStudentName').value = '';
    document.getElementById('newStudentDNI').value = '';
    
    if (currentCourse) {
        showCourseDetail(currentCourse.id);
    } else {
        showStudentsSection();
    }
}

function removeStudent(studentId) {
    const student = appData.students.find(s => s.id === studentId);
    if (!student) return;
    const course = appData.courses.find(c => c.id === student.courseId);
    if (!course) return;

    // Role check
    if (currentUser.role !== 'general') {
        const courseYear = parseInt(course.name, 10);
        const courseDivision = course.name.split(' ')[1];
        if (currentUser.role === 'ciclo1' && courseYear > 2) {
            alert('No tiene permisos para eliminar alumnos del segundo ciclo.');
            return;
        }
        if (['electromecanica', 'informatica', 'automotores'].includes(currentUser.role)) {
            if (courseYear <= 2) {
                alert('No tiene permisos para eliminar alumnos del primer ciclo.');
                return;
            }
            if (currentUser.role === 'electromecanica' && courseDivision !== 'A') {
                alert('No tiene permisos para eliminar alumnos de otra orientación.');
                return;
            }
            if (currentUser.role === 'informatica' && courseDivision !== 'B') {
                alert('No tiene permisos para eliminar alumnos de otra orientación.');
                return;
            }
            if (currentUser.role === 'automotores' && courseDivision !== 'C') {
                alert('No tiene permisos para eliminar alumnos de otra orientación.');
                return;
            }
        }
    }

    if (confirm('¿Está seguro de eliminar este alumno?')) {
        appData.students = appData.students.filter(s => s.id !== studentId);
        delete appData.grades[studentId];
        appData.attendance = appData.attendance.filter(a => !a.present.includes(studentId) && !a.absent.includes(studentId));
        saveData();
        showStudentsSection();
    }
}

function openEditYearModal() {
    document.getElementById('schoolYear').value = appData.schoolInfo.year;
    openModal('editYearModal');
}

function saveYear() {
    const newYear = document.getElementById('schoolYear').value;
    if (newYear) {
        appData.schoolInfo.year = parseInt(newYear, 10);
        saveData();
        closeModal('editYearModal');
        showAdminSection('dashboard');
    }
}

// ============================================
// FUNCIONES DE ASISTENCIA POR CURSO
// ============================================

function openCourseAttendanceModal(courseId) {
    currentCourse = appData.courses.find(c => c.id === courseId);
    const studentList = document.getElementById('attendanceStudentList');
    const courseStudents = appData.students.filter(s => s.courseId === courseId);
    
    let html = '';
    courseStudents.forEach(student => {
        html += `
            <div>
                <input type="checkbox" id="student-${student.id}" value="${student.id}" checked>
                <label for="student-${student.id}">${student.name}</label>
            </div>
        `;
    });
    
    studentList.innerHTML = html;
    document.getElementById('attendanceDate').valueAsDate = new Date();
    
    const attendanceDateInput = document.getElementById('attendanceDate');
    const saveAttendanceBtn = document.querySelector('#courseAttendanceModal .btn-primary');
    const attendanceError = document.getElementById('attendanceError');

    attendanceDateInput.addEventListener('change', function() {
        const date = new Date(this.value);
        const day = date.getUTCDay();
        if ([6, 0].includes(day)) {
            saveAttendanceBtn.disabled = true;
            attendanceError.textContent = 'No se puede guardar asistencia en fin de semana.';
            attendanceError.classList.add('show');
        } else {
            saveAttendanceBtn.disabled = false;
            attendanceError.classList.remove('show');
        }
    });

    openModal('courseAttendanceModal');
}

function saveCourseAttendance() {
    console.log('saveCourseAttendance called');
    const date = document.getElementById('attendanceDate').value;
    const shift = document.getElementById('attendanceShift').value;
    const presentStudentIds = Array.from(document.querySelectorAll('#attendanceStudentList input[type=checkbox]:checked')).map(cb => cb.value);
    
    console.log('Date:', date);
    console.log('Shift:', shift);
    console.log('Present students:', presentStudentIds);

    if (!date) {
        alert('Por favor seleccione una fecha');
        return;
    }
    
    const courseStudents = appData.students.filter(s => s.courseId === currentCourse.id);
    const absentStudentIds = courseStudents.filter(s => !presentStudentIds.includes(s.id)).map(s => s.id);
    
    console.log('Absent students:', absentStudentIds);

    const attendanceRecord = {
        date,
        courseId: currentCourse.id,
        shift,
        present: presentStudentIds,
        absent: absentStudentIds
    };
    
    console.log('Attendance record:', attendanceRecord);

    const existingRecordIndex = appData.attendance.findIndex(a => a.date === date && a.courseId === currentCourse.id && a.shift === shift);
    
    if (existingRecordIndex > -1) {
        console.log('Updating existing record');
        appData.attendance[existingRecordIndex] = attendanceRecord;
    } else {
        console.log('Adding new record');
        appData.attendance.push(attendanceRecord);
    }
    
    saveData();
    closeModal('courseAttendanceModal');
}

function calculateStudentAttendance(studentId) {
    let present = 0;
    let absent = 0;
    
    appData.attendance.forEach(record => {
        if (record.present.includes(studentId)) {
            if (record.shift === 'both') {
                present += 1;
            } else {
                present += 0.5;
            }
        }
        if (record.absent.includes(studentId)) {
            if (record.shift === 'both') {
                absent += 1;
            } else {
                absent += 0.5;
            }
        }
    });
    
    return { present, absent };
}

// ============================================
// FUNCIONES DE NOTAS (SIMPLIFICADAS)
// ============================================

function openGradesModal(studentId) {
    currentStudent = appData.students.find(s => s.id === studentId);
    document.getElementById('trimesterSelect').value = '';
    document.getElementById('gradesForm').innerHTML = '';
    document.getElementById('saveGradesBtn').style.display = 'none';
    openModal('gradesModal');
}

function loadGradesForTrimester() {
    const trimester = document.getElementById('trimesterSelect').value;
    if (!trimester) {
        document.getElementById('gradesForm').innerHTML = '';
        document.getElementById('saveGradesBtn').style.display = 'none';
        return;
    }
    
    const subjectIds = appData.courseSubjects[currentStudent.courseId] || [];
    const subjects = subjectIds.map(id => appData.subjects.find(s => s.id === id)).filter(Boolean);
    const grades = appData.grades[currentStudent.id] || {};
    
    let html = '<div class="notes-grid">';
    subjects.forEach(subject => {
        const subjectGrades = grades[subject.name] || {};
        const currentGrade = subjectGrades[trimester] || '';
        
        html += `
            <div class="grade-input-row">
                <label>${subject.name}:</label>
                <input type="number" min="1" max="10" step="0.01" 
                       id="grade_${subject.name}" value="${currentGrade}" 
                       placeholder="Nota">
            </div>
        `;
    });
    html += '</div>';
    
    document.getElementById('gradesForm').innerHTML = html;
    document.getElementById('saveGradesBtn').style.display = 'block';
}

function saveGrades() {
    const trimester = document.getElementById('trimesterSelect').value;
    if (!trimester) {
        alert('Por favor seleccione un trimestre');
        return;
    }
    
    const studentId = currentStudent.id;
    const subjectIds = appData.courseSubjects[currentStudent.courseId] || [];
    const subjects = subjectIds.map(id => appData.subjects.find(s => s.id === id)).filter(Boolean);
    
    if (!appData.grades[studentId]) {
        appData.grades[studentId] = {};
    }
    
    subjects.forEach(subject => {
        const gradeInput = document.getElementById(`grade_${subject.name}`);
        if (gradeInput) {
            const gradeValue = parseFloat(gradeInput.value);
            
            if (!appData.grades[studentId][subject.name]) {
                appData.grades[studentId][subject.name] = {};
            }
            
            if (!isNaN(gradeValue)) {
                appData.grades[studentId][subject.name][trimester] = gradeValue;
            }
        }
    });
    
    saveData();
    closeModal('gradesModal');
    showStudentDetail(studentId);
}



// ============================================
// INICIALIZACIÓN
// ============================================

window.addEventListener('DOMContentLoaded', function() {
    loadData();
    loadContent('login', 'main-container');
    loadContent('modals', 'modal-container');
});


// --- Libreta: add subtle enter/leave animations when main content changes ---
(function(){
    function applyEnter(el){
        if(!el) return;
        el.classList.remove('leave');
        void el.offsetWidth;
        el.classList.add('enter');
        setTimeout(()=> el.classList.remove('enter'), 700);
    }
    function applyLeave(el){
        if(!el) return;
        el.classList.remove('enter');
        el.classList.add('leave');
    }

    // Observe content containers and animate on childList changes
    const targets = ['studentContent','adminContent','loginScreen','mainPanel','content'];
    targets.forEach(id=>{
        const node = document.getElementById(id);
        if(!node) return;
        const mo = new MutationObserver((mutations)=>{
            // trigger leave then enter
            applyLeave(node);
            setTimeout(()=> applyEnter(node), 90);
        });
        mo.observe(node, { childList: true, subtree: false });
    });

    // Also animate when nav menu items are clicked (delegation)
    document.addEventListener('click', function(e){
        const li = e.target.closest && e.target.closest('li');
        if(li && li.parentElement && li.parentElement.classList.contains('top-nav-menu')){
            const content = document.querySelector('.content');
            applyLeave(content);
            setTimeout(()=> applyEnter(content), 90);
        }
    });
})();
