import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/translator';
import { useEventStore } from '../store/EventStore';
import LocalDB from '../db/LocalDB';

export function Onboarding({ onOnboardingComplete }) {
  const { t, lang, setLang } = useTranslation();
  const { updateProfile } = useEventStore();

  const [formData, setFormData] = useState({
    age: '',
    weight: '',
    gender: 'male',
    occupation: 'fulltime', // 'student' | 'freelancer' | 'fulltime' | 'parttime'
    hasExtraJob: false,
    sleepTime: '22:30',
    wakeTime: '06:30',
    workStart: '08:00',
    workEnd: '16:00',
    extraWorkStart: '',
    extraWorkEnd: '',
    language: 'ar'
  });

  useEffect(() => {
    // Populate form if user profile already exists
    const profile = LocalDB.getUserProfile('local_user_default');
    if (profile) {
      setFormData({
        age: profile.age || '',
        weight: profile.weight || '',
        gender: profile.gender || 'male',
        occupation: profile.occupation || 'fulltime',
        hasExtraJob: profile.hasExtraJob || false,
        sleepTime: profile.sleepTime || '22:30',
        wakeTime: profile.wakeTime || '06:30',
        workStart: profile.workStart || '08:00',
        workEnd: profile.workEnd || '16:00',
        extraWorkStart: profile.extraWorkStart || '',
        extraWorkEnd: profile.extraWorkEnd || '',
        language: profile.language || lang
      });
    } else {
      setFormData(prev => ({ ...prev, language: lang }));
    }
  }, [lang]);

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData(prev => {
      const updated = {
        ...prev,
        [id]: type === 'checkbox' ? checked : value
      };
      
      // Auto-disable extra job if freelancer is selected
      if (id === 'occupation' && value === 'freelancer') {
        updated.hasExtraJob = false;
        updated.extraWorkStart = '';
        updated.extraWorkEnd = '';
      }
      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const profile = {
      uid: 'local_user_default',
      age: parseInt(formData.age, 10),
      weight: parseFloat(formData.weight),
      gender: formData.gender,
      occupation: formData.occupation,
      hasExtraJob: formData.occupation !== 'freelancer' && formData.hasExtraJob,
      sleepTime: formData.sleepTime,
      wakeTime: formData.wakeTime,
      workStart: formData.workStart,
      workEnd: formData.workEnd,
      extraWorkStart: (formData.occupation !== 'freelancer' && formData.hasExtraJob) ? formData.extraWorkStart : null,
      extraWorkEnd: (formData.occupation !== 'freelancer' && formData.hasExtraJob) ? formData.extraWorkEnd : null,
      language: formData.language
    };
    
    // Save to DB and context
    updateProfile(profile);
    setLang(formData.language);
    onOnboardingComplete();
  };

  // Helper to determine the core work/study input labels
  const getWorkLabels = () => {
    switch (formData.occupation) {
      case 'student':
        return {
          start: t('onboarding.studyHoursStart'),
          end: t('onboarding.studyHoursEnd')
        };
      case 'freelancer':
        return {
          start: t('onboarding.freelanceHoursStart'),
          end: t('onboarding.freelanceHoursEnd')
        };
      default:
        return {
          start: t('onboarding.workStart'),
          end: t('onboarding.workEnd')
        };
    }
  };

  const workLabels = getWorkLabels();

  return (
    <div className="onboarding-container animate-fade-in">
      <div className="glass-card onboarding-card">
        <div className="onboarding-header">
          <h2>{t('onboarding.title')}</h2>
          <p>{t('onboarding.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="onboarding-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="language">{t('onboarding.langSelect')}</label>
              <select 
                id="language" 
                value={formData.language} 
                onChange={(e) => {
                  handleChange(e);
                  setLang(e.target.value);
                }}
              >
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="gender">{t('onboarding.gender')}</label>
              <select id="gender" value={formData.gender} onChange={handleChange}>
                <option value="male">{t('onboarding.male')}</option>
                <option value="female">{t('onboarding.female')}</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="age">{t('onboarding.age')}</label>
              <input
                type="number"
                id="age"
                min="1"
                max="120"
                value={formData.age}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="weight">{t('onboarding.weight')}</label>
              <input
                type="number"
                id="weight"
                min="10"
                max="300"
                step="0.1"
                value={formData.weight}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-divider">
            <span>{lang === 'ar' ? 'نمط النشاط المهني' : 'Activity & Occupation Profile'}</span>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="occupation">{t('onboarding.occupation')}</label>
              <select id="occupation" value={formData.occupation} onChange={handleChange}>
                <option value="student">{t('onboarding.student')}</option>
                <option value="freelancer">{t('onboarding.freelancer')}</option>
                <option value="fulltime">{t('onboarding.fulltime')}</option>
                <option value="parttime">{t('onboarding.parttime')}</option>
              </select>
            </div>

            {formData.occupation !== 'freelancer' ? (
              <div className="form-group checkbox-group">
                <label htmlFor="hasExtraJob" className="checkbox-label">
                  <input
                    type="checkbox"
                    id="hasExtraJob"
                    checked={formData.hasExtraJob}
                    onChange={handleChange}
                  />
                  <span>{t('onboarding.hasExtraJob')}</span>
                </label>
              </div>
            ) : (
              <div className="form-group">
                {/* Visual placeholder to keep grid layout aligned */}
                <label>&nbsp;</label>
                <span className="info-text-sm">
                  {lang === 'ar' 
                    ? '💡 المستقلون لا يخضعون لجداول العمل الإضافي المحددة' 
                    : '💡 Freelancers manage their own extended block hours'}
                </span>
              </div>
            )}
          </div>

          <div className="form-divider">
            <span>{lang === 'ar' ? 'ساعات اليقظة والنوم' : 'Circadian Sleep/Wake Times'}</span>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="wakeTime">{t('onboarding.wakeTime')}</label>
              <input
                type="time"
                id="wakeTime"
                value={formData.wakeTime}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="sleepTime">{t('onboarding.sleepTime')}</label>
              <input
                type="time"
                id="sleepTime"
                value={formData.sleepTime}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-divider">
            <span>{lang === 'ar' ? 'جدول ساعات العمل والتركيز' : 'Work & Focus Hours'}</span>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="workStart">{workLabels.start}</label>
              <input
                type="time"
                id="workStart"
                value={formData.workStart}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="workEnd">{workLabels.end}</label>
              <input
                type="time"
                id="workEnd"
                value={formData.workEnd}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {formData.occupation !== 'freelancer' && formData.hasExtraJob && (
            <div className="form-row animate-fade-in">
              <div className="form-group">
                <label htmlFor="extraWorkStart">{t('onboarding.extraWorkStart')}</label>
                <input
                  type="time"
                  id="extraWorkStart"
                  value={formData.extraWorkStart}
                  onChange={handleChange}
                  required={formData.hasExtraJob}
                />
              </div>

              <div className="form-group">
                <label htmlFor="extraWorkEnd">{t('onboarding.extraWorkEnd')}</label>
                <input
                  type="time"
                  id="extraWorkEnd"
                  value={formData.extraWorkEnd}
                  onChange={handleChange}
                  required={formData.hasExtraJob}
                />
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-block">
            {t('onboarding.submit')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Onboarding;
