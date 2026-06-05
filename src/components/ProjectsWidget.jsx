import React from 'react';
import { useTranslation } from '../i18n/translator';
import { useEventStore } from '../store/EventStore';

export function ProjectsWidget() {
  const { t, lang } = useTranslation();
  const { emit } = useEventStore();

  const handleAddProject = () => {
    // Emit notification event to be captured by the central dashboard header
    emit('notify', {
      title: 'LEGO Update!',
      titleAr: 'تحديث الليجو!',
      message: 'Projects module is coming soon in the next LEGO update!',
      messageAr: 'موديول المشاريع قادم قريباً في تحديث الليجو التالي!',
      type: 'info'
    });
  };

  return (
    <div className="widget-card projects-widget coming-soon-card animate-fade-in">
      <div className="widget-header">
        <h3>{t('dashboard.projectsTitle')}</h3>
        <span className="badge badge-general">
          {t('dashboard.comingSoon')}
        </span>
      </div>

      <div className="widget-body text-center">
        <div className="projects-placeholder">
          <span className="placeholder-icon">📂</span>
          <p className="placeholder-text">
            {lang === 'ar' 
              ? 'قم بتنظيم مهامك ودراستك في مشاريع مستقلة قريباً!' 
              : 'Organize your tasks and courses into independent projects soon!'}
          </p>
        </div>

        <button onClick={handleAddProject} className="btn btn-project-add animate-bounce-on-hover">
          {t('dashboard.addProject')}
        </button>
      </div>

      <div className="widget-footer text-center">
        <span className="info-text-sm">
          {lang === 'ar' 
            ? '📦 يدعم الربط مع موديولات الطلاب والمهام المتعددة' 
            : '📦 Supports integration with student courses and multitask logs'}
        </span>
      </div>
    </div>
  );
}

export default ProjectsWidget;
