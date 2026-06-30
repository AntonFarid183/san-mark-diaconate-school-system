import { useState, useEffect } from 'react';
import apiClient from '../apiClient';
import Layout from '../Layout';

const ContentManagementScreen = () => {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showUpload, setShowUpload] = useState(null);
  const [editLesson, setEditLesson] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', lessonNumber: 1, weekNumber: 1, stageId: '', gradeId: '' });
  const [stages, setStages] = useState([]);
  const [grades, setGrades] = useState([]);
  const [uploadForm, setUploadForm] = useState({ title: '', type: 'Pdf', file: null, fileUrl: '' });

  useEffect(() => {
    const fetch = async () => {
      try {
        const [ls, sg] = await Promise.all([
          apiClient.get('/content/lessons?pageSize=100'),
          apiClient.get('/students/stages'),
        ]);
        setLessons(ls.data.lessons || []);
        setStages(sg.data || []);
      } catch (err) { console.error('Failed to load lessons', err); } finally { setLoading(false); }
    };
    fetch();
  }, []);

  useEffect(() => {
    if (form.stageId) {
      apiClient.get(`/students/stages/${form.stageId}/grades`).then(r => setGrades(r.data || [])).catch(() => {});
    } else { setGrades([]); }
  }, [form.stageId]);

  const handleCreate = async () => {
    try {
      if (editLesson) {
        await apiClient.put(`/content/lessons/${editLesson.id}`, form);
      } else {
        await apiClient.post('/content/lessons', form);
      }
      setShowCreate(false); setEditLesson(null); setForm({ title: '', description: '', lessonNumber: 1, weekNumber: 1, stageId: '', gradeId: '' });
      const ls = await apiClient.get('/content/lessons?pageSize=100');
      setLessons(ls.data.lessons || []);
    } catch (err) { console.error('Failed to save lesson', err); }
  };

  const handleUpload = async () => {
    if (!showUpload || !uploadForm.file) return;
    const fd = new FormData();
    fd.append('lessonId', showUpload.id);
    fd.append('title', uploadForm.title);
    fd.append('type', uploadForm.type);
    fd.append('file', uploadForm.file);
    try {
      await apiClient.post('/content/items', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setShowUpload(null); setUploadForm({ title: '', type: 'Pdf', file: null, fileUrl: '' });
      const ls = await apiClient.get('/content/lessons?pageSize=100');
      setLessons(ls.data.lessons || []);
    } catch (err) { console.error('Failed to upload content', err); }
  };

  const handlePublish = async (id, publish) => {
    try {
      await apiClient.put(`/content/lessons/${id}/${publish ? 'publish' : 'archive'}`);
      const ls = await apiClient.get('/content/lessons?pageSize=100');
      setLessons(ls.data.lessons || []);
    } catch (err) { console.error('Failed to publish/archive lesson', err); }
  };

  const handleReorder = async (id, direction) => {
    const idx = lessons.findIndex(l => l.id === id);
    if (idx < 0) return;
    const newLessons = [...lessons];
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= newLessons.length) return;
    [newLessons[idx], newLessons[swapIdx]] = [newLessons[swapIdx], newLessons[idx]];
    try {
      await apiClient.put('/content/lessons/reorder', { lessonIds: newLessons.map(l => l.id) });
      setLessons(newLessons);
    } catch (err) { console.error('Failed to reorder lessons', err); }
  };

  const openEdit = (lesson) => {
    setEditLesson(lesson);
    setForm({ title: lesson.title, description: lesson.description || '', lessonNumber: lesson.lessonNumber, weekNumber: lesson.weekNumber || 1, stageId: lesson.stageId || '', gradeId: lesson.gradeId || '' });
    setShowCreate(true);
  };

  return (
    <Layout title="إدارة المحتوى">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.9rem' }}>إضافة وتعديل وترتيب الدروس والمحتوى التعليمي</p>
        <button onClick={() => { setEditLesson(null); setForm({ title: '', description: '', lessonNumber: 1, weekNumber: 1, stageId: '', gradeId: '' }); setShowCreate(true); }} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
          درس جديد
        </button>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: '3rem' }}>جاري التحميل...</p>
      ) : (
        <div className="glass-card" style={{ overflow: 'hidden', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <th style={{ textAlign: 'right', padding: '0.75rem 1rem' }}>#</th>
                <th style={{ textAlign: 'right', padding: '0.75rem 1rem' }}>العنوان</th>
                <th style={{ textAlign: 'center', padding: '0.75rem 1rem' }}>الحالة</th>
                <th style={{ textAlign: 'center', padding: '0.75rem 1rem' }}>الملفات</th>
                <th style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {lessons.map((lesson, i) => (
                <tr key={lesson.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>{lesson.lessonNumber}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontWeight: 600 }}>{lesson.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lesson.gradeName}</div>
                  </td>
                  <td style={{ textAlign: 'center', padding: '0.75rem 1rem' }}>
                    <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '20px', background: lesson.isPublished ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.08)', color: lesson.isPublished ? '#10b981' : 'var(--text-secondary)' }}>
                      {lesson.isPublished ? 'منشور' : 'مسودة'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center', padding: '0.75rem 1rem', fontSize: '0.85rem' }}>{lesson.contentItemCount || 0}</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>
                    <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'flex-end' }}>
                      <button onClick={() => openEdit(lesson)} className="btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} title="تعديل">
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                      </button>
                      <button onClick={() => setShowUpload(lesson)} className="btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} title="رفع ملف">
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>upload</span>
                      </button>
                      <button onClick={() => handlePublish(lesson.id, !lesson.isPublished)} className="btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} title={lesson.isPublished ? 'أرشفة' : 'نشر'}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{lesson.isPublished ? 'archive' : 'publish'}</span>
                      </button>
                      <button onClick={() => handleReorder(lesson.id, 'up')} disabled={i === 0} className="btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} title="رفع">
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>keyboard_arrow_up</span>
                      </button>
                      <button onClick={() => handleReorder(lesson.id, 'down')} disabled={i === lessons.length - 1} className="btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} title="خفض">
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>keyboard_arrow_down</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={(e) => { if (e.target === e.currentTarget) { setShowCreate(false); setEditLesson(null); } }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '500px', padding: '1.5rem' }}>
            <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1rem' }}>{editLesson ? 'تعديل الدرس' : 'درس جديد'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>العنوان</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input-field" placeholder="عنوان الدرس" />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>الوصف</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-field" style={{ minHeight: '80px' }} placeholder="وصف الدرس" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>رقم الدرس</label>
                  <input type="number" value={form.lessonNumber} onChange={e => setForm({ ...form, lessonNumber: parseInt(e.target.value) })} className="input-field" />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>رقم الأسبوع</label>
                  <input type="number" value={form.weekNumber} onChange={e => setForm({ ...form, weekNumber: parseInt(e.target.value) })} className="input-field" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>المرحلة</label>
                  <select value={form.stageId} onChange={e => setForm({ ...form, stageId: e.target.value })} className="input-field">
                    <option value="">اختر المرحلة</option>
                    {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>الصف</label>
                  <select value={form.gradeId} onChange={e => setForm({ ...form, gradeId: e.target.value })} className="input-field">
                    <option value="">اختر الصف</option>
                    {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                <button onClick={() => { setShowCreate(false); setEditLesson(null); }} className="btn-secondary">إلغاء</button>
                <button onClick={handleCreate} className="btn-primary">{editLesson ? 'تحديث' : 'إنشاء'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload modal */}
      {showUpload && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={(e) => { if (e.target === e.currentTarget) { setShowUpload(null); } }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '450px', padding: '1.5rem' }}>
            <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1rem' }}>رفع ملف للدرس: {showUpload.title}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>عنوان الملف</label>
                <input value={uploadForm.title} onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })} className="input-field" placeholder="عنوان المحتوى" />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>النوع</label>
                <select value={uploadForm.type} onChange={e => setUploadForm({ ...uploadForm, type: e.target.value })} className="input-field">
                  <option value="Pdf">PDF</option>
                  <option value="Video">فيديو</option>
                  <option value="Audio">صوتي</option>
                  <option value="Image">صورة</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>الملف</label>
                <input type="file" onChange={e => setUploadForm({ ...uploadForm, file: e.target.files[0] })} className="input-field" style={{ padding: '0.5rem' }} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowUpload(null)} className="btn-secondary">إلغاء</button>
                <button onClick={handleUpload} className="btn-primary">رفع</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ContentManagementScreen;
