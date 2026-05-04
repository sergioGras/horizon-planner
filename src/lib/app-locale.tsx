import { createContext, useContext, useEffect, useState } from "react";
import { enUS, es as dateFnsEs, type Locale as DateFnsLocale } from "date-fns/locale";

export type AppLocale = "en" | "es";

export type ShellCopy = {
  brand: string;
  signIn: {
    inviteHeading: string;
    defaultHeading: string;
    inviteDescription: string;
    defaultDescription: string;
    inviteButton: string;
    defaultButton: string;
    configError: string;
    inviteNotice: string;
  };
  authGate: {
    loadingSession: string;
    inviteTitle: string;
    accepted: (projectTitle: string) => string;
    invalid: string;
    expired: string;
    wrongAccount: string;
    dismiss: string;
    close: string;
    tryAnotherAccount: string;
  };
  header: {
    timelineLabel: string;
    timelineProjects: string;
    localProject: string;
    language: string;
    scaleMonth: string;
    scaleQuarter: string;
    scaleYear: string;
    today: string;
    importRoadmap: string;
    newMilestone: string;
    saving: string;
    shareProject: string;
    projectMembers: string;
    renameProject: string;
    deleteProject: string;
    leaveProject: string;
    signInToSave: string;
    signInWithGoogle: string;
    profileMenu: string;
    signIn: string;
    signOut: string;
    newProject: string;
    localOnlyWorkspace: string;
  };
  timeline: {
    sectionsLabel: string;
    weekAbbrev: string;
    today: string;
    commitmentLabel: string;
    intentionLabel: string;
    commitmentShort: string;
    intentionShort: string;
    clusterItems: (count: number) => string;
    clusterTitle: (count: number) => string;
  };
  sectionLane: {
    addMilestone: string;
    add: string;
    sectionActions: string;
    editSection: string;
    moveUp: string;
    moveDown: string;
    deleteSection: string;
    milestonesCount: (count: number) => string;
    noMilestones: string;
  };
  board: {
    loadingRoadmap: string;
    createProjectTitle: string;
    createProjectDescription: string;
    newProject: string;
  };
  emptyBoard: {
    title: string;
    description: string;
    action: string;
    label: string;
  };
  projectDialog: {
    newTitle: string;
    renameTitle: string;
    label: string;
    placeholder: string;
    cancel: string;
    create: string;
    save: string;
  };
  sectionDialog: {
    newTitle: string;
    editTitle: string;
    nameLabel: string;
    namePlaceholder: string;
    paletteLabel: string;
    cancel: string;
    create: string;
    save: string;
  };
  milestoneDialog: {
    newTitle: string;
    editTitle: string;
    description: string;
    titleLabel: string;
    titlePlaceholder: string;
    sectionLabel: string;
    sectionPlaceholder: string;
    typeLabel: string;
    typePlaceholder: string;
    commitment: string;
    intention: string;
    dateLabel: string;
    datePlaceholder: string;
    descriptionLabel: string;
    descriptionPlaceholder: string;
    delete: string;
    deleteTitle: string;
    deleteDescription: string;
    cancel: string;
    create: string;
    save: string;
  };
  confirm: {
    cancel: string;
    confirm: string;
    deleteProjectTitle: (title: string) => string;
    deleteProjectDescription: string;
    deleteSectionTitle: (title: string) => string;
    deleteSectionDescription: string;
  };
  importLocal: {
    title: string;
    description: string;
    stats: (sections: number, milestones: number) => string;
    startBlank: string;
    importRoadmap: string;
  };
  importRoadmap: {
    title: string;
    description: string;
    dropPrompt: string;
    dropHint: string;
    browseFiles: string;
    downloadSkill: string;
    downloadSample: string;
    validating: string;
    errorTitle: (fileName: string) => string;
    importedRoadmap: string;
    commitments: string;
    intentions: string;
    anchor: string;
    sections: string;
    milestones: string;
    sectionLabel: string;
    milestoneLabel: string;
    noSections: string;
    noMilestones: string;
    view: string;
    importButton: string;
  };
  shareProject: {
    title: string;
    descriptionOwner: string;
    descriptionMember: string;
    noProjectSelected: string;
    projectLabel: string;
    inviteByEmail: string;
    inviteDescription: string;
    emailLabel: string;
    emailPlaceholder: string;
    createInvite: string;
    inviteLink: string;
    copyLink: string;
    membersTitle: string;
    membersDescription: string;
    loadingMembers: string;
    noCollaborators: string;
    pendingTitle: string;
    pendingDescription: string;
    leaveProject: string;
    close: string;
    you: string;
    member: string;
    invited: string;
    expiresOn: string;
  };
  notFound: {
    title: string;
    description: string;
    home: string;
  };
};

const COPY: Record<AppLocale, ShellCopy> = {
  en: {
    brand: "Roadmap",
    signIn: {
      inviteHeading: "Join a shared timeline",
      defaultHeading: "Sign in to your planning surface",
      inviteDescription:
        "Sign in with the invited account to join the shared project and continue editing.",
      defaultDescription:
        "Persistent private roadmaps, personal projects, and milestone planning across the year.",
      inviteButton: "Continue with Google and join",
      defaultButton: "Continue with Google",
      configError:
        "Supabase is not configured. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.",
      inviteNotice:
        "An invite link was found in the URL. After sign-in, the shared project will open automatically.",
    },
    authGate: {
      loadingSession: "Loading session...",
      inviteTitle: "Project invite",
      accepted: (projectTitle) => `Joined ${projectTitle}. Opening the shared project...`,
      invalid: "This invite could not be accepted.",
      expired: "This invite has expired or is no longer valid.",
      wrongAccount: "This invite was sent to a different email address.",
      dismiss: "Dismiss",
      close: "Close",
      tryAnotherAccount: "Try another account",
    },
    header: {
      timelineLabel: "Timeline",
      timelineProjects: "Timeline projects",
      localProject: "Local Roadmap",
      language: "Language",
      scaleMonth: "Month",
      scaleQuarter: "Quarter",
      scaleYear: "Year",
      today: "Today",
      importRoadmap: "Import roadmap",
      newMilestone: "New milestone",
      saving: "Saving",
      shareProject: "Share project",
      projectMembers: "Project members",
      renameProject: "Rename project",
      deleteProject: "Delete project",
      leaveProject: "Leave project",
      signInToSave: "Sign in to save cloud projects",
      signInWithGoogle: "Sign in with Google",
      profileMenu: "Profile menu",
      signIn: "Sign in",
      signOut: "Sign out",
      newProject: "New project",
      localOnlyWorkspace: "Local-only workspace",
    },
    timeline: {
      sectionsLabel: "Sections",
      weekAbbrev: "Wk",
      today: "Today",
      commitmentLabel: "Commitment",
      intentionLabel: "Intention",
      commitmentShort: "Commit",
      intentionShort: "Intent",
      clusterItems: (count) => `${count} milestones`,
      clusterTitle: (count) => `Cluster - ${count} items`,
    },
    sectionLane: {
      addMilestone: "Add milestone",
      add: "Add",
      sectionActions: "Section actions",
      editSection: "Edit section",
      moveUp: "Move up",
      moveDown: "Move down",
      deleteSection: "Delete",
      milestonesCount: (count) => `${count} milestones`,
      noMilestones: "No milestones",
    },
    board: {
      loadingRoadmap: "Loading roadmap...",
      createProjectTitle: "Create a project",
      createProjectDescription: "Projects keep separate personal roadmaps under the same account.",
      newProject: "New project",
    },
    emptyBoard: {
      title: "Empty roadmap",
      description:
        "Start with your first section and shape the year around major milestones and bandwidth.",
      action: "Create first section",
      label: "Add a section to begin",
    },
    projectDialog: {
      newTitle: "New project",
      renameTitle: "Rename project",
      label: "Project name",
      placeholder: "e.g. 2026 Strategic Roadmap",
      cancel: "Cancel",
      create: "Create project",
      save: "Save",
    },
    sectionDialog: {
      newTitle: "New section",
      editTitle: "Edit section",
      nameLabel: "Name",
      namePlaceholder: "e.g. Core",
      paletteLabel: "Palette",
      cancel: "Cancel",
      create: "Create section",
      save: "Save",
    },
    milestoneDialog: {
      newTitle: "New milestone",
      editTitle: "Edit milestone",
      description: "A point-in-time event on your roadmap.",
      titleLabel: "Title",
      titlePlaceholder: "e.g. Foundation refactor v1",
      sectionLabel: "Section",
      sectionPlaceholder: "Choose section",
      typeLabel: "Type",
      typePlaceholder: "Choose type",
      commitment: "Commitment",
      intention: "Intention",
      dateLabel: "Date",
      datePlaceholder: "Pick a date",
      descriptionLabel: "Description",
      descriptionPlaceholder: "Optional context.",
      delete: "Delete",
      deleteTitle: "Delete this milestone?",
      deleteDescription: "This action cannot be undone.",
      cancel: "Cancel",
      create: "Create milestone",
      save: "Save changes",
    },
    confirm: {
      cancel: "Cancel",
      confirm: "Confirm",
      deleteProjectTitle: (title) => `Delete "${title}"?`,
      deleteProjectDescription:
        "All sections and milestones in this project will be deleted. This cannot be undone.",
      deleteSectionTitle: (title) => `Delete "${title}"?`,
      deleteSectionDescription:
        "All milestones in this section will also be deleted. This cannot be undone.",
    },
    importLocal: {
      title: "Import this roadmap?",
      description:
        "Existing local data was found on this browser. You can copy it into your first cloud project once, or start with a blank project.",
      stats: (sections, milestones) =>
        `${sections} sections and ${milestones} milestones available to import.`,
      startBlank: "Start blank",
      importRoadmap: "Import roadmap",
    },
    importRoadmap: {
      title: "Import roadmap JSON",
      description:
        "Drop a roadmap JSON file here or browse for one. The file is validated before import, and you can preview the contents first.",
      dropPrompt: "Drag and drop a roadmap JSON file here",
      dropHint:
        "The file should use the `horizon-roadmap` schema. Unknown fields are ignored by the spec docs, but the current validator expects a clean v1 file.",
      browseFiles: "Browse files",
      downloadSkill: "Download skill",
      downloadSample: "Download sample",
      validating: "Validating file...",
      errorTitle: (fileName) => `Could not parse ${fileName}.`,
      importedRoadmap: "Imported roadmap",
      commitments: "Commitments",
      intentions: "Intentions",
      anchor: "Anchor",
      sections: "Sections",
      milestones: "Milestones",
      sectionLabel: "Sections",
      milestoneLabel: "Milestones",
      noSections: "No sections",
      noMilestones: "No milestones",
      view: "view",
      importButton: "Import roadmap",
    },
    shareProject: {
      title: "Share project",
      descriptionOwner: "Invite collaborators by email. They can join and edit this roadmap.",
      descriptionMember:
        "You can view members and leave this project. Only the owner can invite or revoke access.",
      noProjectSelected: "No project selected.",
      projectLabel: "Project",
      inviteByEmail: "Invite by email",
      inviteDescription: "An invite link is created for the address you enter.",
      emailLabel: "Email address",
      emailPlaceholder: "teammate@company.com",
      createInvite: "Create invite",
      inviteLink: "Invite link",
      copyLink: "Copy link",
      membersTitle: "Members",
      membersDescription: "People with access to this timeline project.",
      loadingMembers: "Loading members...",
      noCollaborators: "No collaborators yet.",
      pendingTitle: "Pending invites",
      pendingDescription: "Copy or revoke pending access.",
      leaveProject: "Leave project",
      close: "Close",
      you: "You",
      member: "Member",
      invited: "Invited",
      expiresOn: "Expires",
    },
    notFound: {
      title: "Page not found",
      description: "The page you're looking for doesn't exist or has been moved.",
      home: "Go home",
    },
  },
  es: {
    brand: "Roadmap",
    signIn: {
      inviteHeading: "Unirse a una línea compartida",
      defaultHeading: "Inicia sesión en tu espacio de planificación",
      inviteDescription:
        "Inicia sesión con la cuenta invitada para unirte al proyecto compartido y seguir editando.",
      defaultDescription:
        "Roadmaps privados persistentes, proyectos personales y planificación de hitos a lo largo del año.",
      inviteButton: "Continuar con Google y unirse",
      defaultButton: "Continuar con Google",
      configError:
        "Supabase no está configurado. Añade `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.",
      inviteNotice:
        "Se encontró un enlace de invitación en la URL. Tras iniciar sesión, el proyecto compartido se abrirá automáticamente.",
    },
    authGate: {
      loadingSession: "Cargando sesión...",
      inviteTitle: "Invitación al proyecto",
      accepted: (projectTitle) =>
        `Te has unido a ${projectTitle}. Abriendo el proyecto compartido...`,
      invalid: "No se ha podido aceptar esta invitación.",
      expired: "Esta invitación ha caducado o ya no es válida.",
      wrongAccount: "Esta invitación se envió a otra dirección de correo.",
      dismiss: "Descartar",
      close: "Cerrar",
      tryAnotherAccount: "Probar con otra cuenta",
    },
    header: {
      timelineLabel: "Cronograma",
      timelineProjects: "Proyectos del cronograma",
      localProject: "Roadmap local",
      language: "Idioma",
      scaleMonth: "Mes",
      scaleQuarter: "Trimestre",
      scaleYear: "Año",
      today: "Hoy",
      importRoadmap: "Importar roadmap",
      newMilestone: "Nuevo hito",
      saving: "Guardando",
      shareProject: "Compartir proyecto",
      projectMembers: "Miembros del proyecto",
      renameProject: "Renombrar proyecto",
      deleteProject: "Eliminar proyecto",
      leaveProject: "Salir del proyecto",
      signInToSave: "Inicia sesión para guardar proyectos en la nube",
      signInWithGoogle: "Iniciar sesión con Google",
      profileMenu: "Menú de perfil",
      signIn: "Iniciar sesión",
      signOut: "Cerrar sesión",
      newProject: "Nuevo proyecto",
      localOnlyWorkspace: "Espacio de trabajo solo local",
    },
    timeline: {
      sectionsLabel: "Secciones",
      weekAbbrev: "Sem",
      today: "Hoy",
      commitmentLabel: "Compromiso",
      intentionLabel: "Intención",
      commitmentShort: "Comprom.",
      intentionShort: "Inten.",
      clusterItems: (count) => `${count} hitos`,
      clusterTitle: (count) => `Grupo - ${count} elementos`,
    },
    sectionLane: {
      addMilestone: "Añadir hito",
      add: "Añadir",
      sectionActions: "Acciones de la sección",
      editSection: "Editar sección",
      moveUp: "Mover arriba",
      moveDown: "Mover abajo",
      deleteSection: "Eliminar",
      milestonesCount: (count) => `${count} hitos`,
      noMilestones: "Sin hitos",
    },
    board: {
      loadingRoadmap: "Cargando roadmap...",
      createProjectTitle: "Crear un proyecto",
      createProjectDescription:
        "Los proyectos mantienen roadmaps personales separados dentro de la misma cuenta.",
      newProject: "Nuevo proyecto",
    },
    emptyBoard: {
      title: "Roadmap vacío",
      description:
        "Empieza con tu primera sección y da forma al año alrededor de los hitos y la capacidad disponible.",
      action: "Crear primera sección",
      label: "Añade una sección para empezar",
    },
    projectDialog: {
      newTitle: "Nuevo proyecto",
      renameTitle: "Renombrar proyecto",
      label: "Nombre del proyecto",
      placeholder: "p. ej. Roadmap estratégico 2026",
      cancel: "Cancelar",
      create: "Crear proyecto",
      save: "Guardar",
    },
    sectionDialog: {
      newTitle: "Nueva sección",
      editTitle: "Editar sección",
      nameLabel: "Nombre",
      namePlaceholder: "p. ej. Núcleo",
      paletteLabel: "Paleta",
      cancel: "Cancelar",
      create: "Crear sección",
      save: "Guardar",
    },
    milestoneDialog: {
      newTitle: "Nuevo hito",
      editTitle: "Editar hito",
      description: "Un evento puntual en tu roadmap.",
      titleLabel: "Título",
      titlePlaceholder: "p. ej. Refactor base v1",
      sectionLabel: "Sección",
      sectionPlaceholder: "Elegir sección",
      typeLabel: "Tipo",
      typePlaceholder: "Elegir tipo",
      commitment: "Compromiso",
      intention: "Intención",
      dateLabel: "Fecha",
      datePlaceholder: "Elegir fecha",
      descriptionLabel: "Descripción",
      descriptionPlaceholder: "Contexto opcional.",
      delete: "Eliminar",
      deleteTitle: "¿Eliminar este hito?",
      deleteDescription: "Esta acción no se puede deshacer.",
      cancel: "Cancelar",
      create: "Crear hito",
      save: "Guardar cambios",
    },
    confirm: {
      cancel: "Cancelar",
      confirm: "Confirmar",
      deleteProjectTitle: (title) => `¿Eliminar "${title}"?`,
      deleteProjectDescription:
        "Todas las secciones y los hitos de este proyecto se eliminarán. Esta acción no se puede deshacer.",
      deleteSectionTitle: (title) => `¿Eliminar "${title}"?`,
      deleteSectionDescription:
        "También se eliminarán todos los hitos de esta sección. Esta acción no se puede deshacer.",
    },
    importLocal: {
      title: "¿Importar este roadmap?",
      description:
        "Se encontraron datos locales existentes en este navegador. Puedes copiarlos a tu primer proyecto en la nube una vez, o empezar con un proyecto vacío.",
      stats: (sections, milestones) =>
        `${sections} secciones y ${milestones} hitos disponibles para importar.`,
      startBlank: "Empezar vacío",
      importRoadmap: "Importar roadmap",
    },
    importRoadmap: {
      title: "Importar JSON del roadmap",
      description:
        "Arrastra aquí un archivo JSON del roadmap o búscalo. El archivo se valida antes de importarlo y puedes previsualizar su contenido primero.",
      dropPrompt: "Arrastra y suelta aquí un archivo JSON del roadmap",
      dropHint:
        "El archivo debe usar el esquema `horizon-roadmap`. Los campos desconocidos se ignoran según la documentación, pero el validador actual espera un archivo v1 limpio.",
      browseFiles: "Buscar archivos",
      downloadSkill: "Descargar skill",
      downloadSample: "Descargar ejemplo",
      validating: "Validando archivo...",
      errorTitle: (fileName) => `No se ha podido analizar ${fileName}.`,
      importedRoadmap: "Roadmap importado",
      commitments: "Compromisos",
      intentions: "Intenciones",
      anchor: "Ancla",
      sections: "Secciones",
      milestones: "Hitos",
      sectionLabel: "Secciones",
      milestoneLabel: "Hitos",
      noSections: "Sin secciones",
      noMilestones: "Sin hitos",
      view: "vista",
      importButton: "Importar roadmap",
    },
    shareProject: {
      title: "Compartir proyecto",
      descriptionOwner: "Invita colaboradores por correo. Podrán unirse y editar este roadmap.",
      descriptionMember:
        "Puedes ver los miembros y salir de este proyecto. Solo el propietario puede invitar o revocar accesos.",
      noProjectSelected: "Ningún proyecto seleccionado.",
      projectLabel: "Proyecto",
      inviteByEmail: "Invitar por correo",
      inviteDescription: "Se crea un enlace de invitación para la dirección que introduzcas.",
      emailLabel: "Correo electrónico",
      emailPlaceholder: "compañero@empresa.com",
      createInvite: "Crear invitación",
      inviteLink: "Enlace de invitación",
      copyLink: "Copiar enlace",
      membersTitle: "Miembros",
      membersDescription: "Personas con acceso a este proyecto timeline.",
      loadingMembers: "Cargando miembros...",
      noCollaborators: "Todavía no hay colaboradores.",
      pendingTitle: "Invitaciones pendientes",
      pendingDescription: "Copia o revoca el acceso pendiente.",
      leaveProject: "Salir del proyecto",
      close: "Cerrar",
      you: "Tú",
      member: "Miembro",
      invited: "Invitado",
      expiresOn: "Caduca",
    },
    notFound: {
      title: "Página no encontrada",
      description: "La página que buscas no existe o se ha movido.",
      home: "Ir al inicio",
    },
  },
};

const LOCALE_STORAGE_KEY = "roadmap:preferred-locale";

const LocaleContext = createContext<AppLocale>("en");
const LocaleSetterContext = createContext<((locale: AppLocale) => void) | null>(null);

export function AppLocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<AppLocale>(() => getInitialLocale());

  useEffect(() => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }, [locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title =
      locale === "es" ? "Roadmap - Tablero editorial" : "Roadmap - Editorial Timeline Board";
  }, [locale]);

  return (
    <LocaleSetterContext.Provider value={setLocale}>
      <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
    </LocaleSetterContext.Provider>
  );
}

export function useAppLocale() {
  return useContext(LocaleContext);
}

export function useSetAppLocale() {
  const setLocale = useContext(LocaleSetterContext);
  if (!setLocale) throw new Error("useSetAppLocale must be used within AppLocaleProvider");
  return setLocale;
}

export function useShellCopy() {
  return COPY[useAppLocale()];
}

export function useDateFnsLocale(): DateFnsLocale {
  return useAppLocale() === "es" ? dateFnsEs : enUS;
}

function detectLocale(): AppLocale {
  if (typeof navigator === "undefined") return "en";

  const browserLocale = navigator.language || navigator.languages?.[0] || "en";
  return browserLocale.toLowerCase().startsWith("es") ? "es" : "en";
}

function getInitialLocale(): AppLocale {
  if (typeof window === "undefined") return "en";

  const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (storedLocale === "en" || storedLocale === "es") return storedLocale;

  return detectLocale();
}
