import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Save, User, Phone, Building2, Mail, MapPin, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { updateProfile } from '../../store/thunks/layoutThunk';
import { fetchMe } from '../../store/thunks/layoutThunk';

export default function ProfileSettings() {
  const dispatch = useDispatch();
  const { me, saving, saveError } = useSelector((s) => s.layout);
  const { user } = useSelector((s) => s.auth);

  const source = me || user || {};

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    mobile: '',
    email: '',
    organisation: '',
    district: '',
    designation: '',
  });

  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  useEffect(() => {
    setForm({
      firstName: source.firstName ?? '',
      lastName: source.lastName ?? '',
      mobile: source.mobile ?? '',
      email: source.email ?? '',
      organisation: source.organisation ?? '',
      district: source.district ?? '',
      designation: source.designation ?? '',
    });
  }, [source.firstName, source.email]);

  useEffect(() => {
    if (saveError) toast.error(saveError);
  }, [saveError]);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.firstName.trim()) return toast.error('First name is required');
    const result = await dispatch(updateProfile(form));
    if (updateProfile.fulfilled.match(result)) {
      toast.success('Profile updated successfully');
    }
  };

  const fields = [
    { name: 'firstName', label: 'First Name', icon: User, required: true },
    { name: 'lastName', label: 'Last Name', icon: User },
    { name: 'mobile', label: 'Mobile Number', icon: Phone, type: 'tel' },
    { name: 'email', label: 'Email Address', icon: Mail, type: 'email' },
    { name: 'organisation', label: 'Organisation', icon: Building2 },
    { name: 'district', label: 'District', icon: MapPin },
    { name: 'designation', label: 'Designation', icon: Shield },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div
        className="rounded-2xl p-6 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#0d2b14 0%,#1a5c2a 60%,#0d2b14 100%)' }}
      >
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center text-2xl font-bold border-2 border-emerald-400">
            {(form.firstName || 'C').charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold">
              {form.firstName || 'CBBO'} {form.lastName}
            </h2>
            <p className="text-emerald-300 text-sm">{form.designation || 'CBBO Officer'}</p>
            <p className="text-emerald-400 text-xs mt-0.5">{form.organisation}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-5">Edit Profile Details</h3>
        <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map(({ name, label, icon: Icon, type = 'text', required }) => (
            <div key={name} className={name === 'organisation' || name === 'email' ? 'sm:col-span-2' : ''}>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                {label} {required && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={type}
                  name={name}
                  value={form[name]}
                  onChange={onChange}
                  required={required}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  placeholder={label}
                />
              </div>
            </div>
          ))}

          <div className="sm:col-span-2 flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
