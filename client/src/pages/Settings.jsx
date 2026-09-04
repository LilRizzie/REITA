import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import ProtectedLayout from '../components/ProtectedLayout';
import { useAuth } from '../context/AuthContext';
import { getSettings, resetSettings, saveSettings } from '../utils/propertyStorage';

const defaults = {
	darkMode: true,
	language: 'English',
	currency: 'NGN',
	emailNotifications: true,
	smsNotifications: false,
	autoReportGeneration: false,
	defaultRoiCalculation: 'Simple ROI',
};

const applyTheme = (darkMode) => {
	document.documentElement.dataset.theme = darkMode ? 'dark' : 'light';
};

export default function Settings() {
	const { user } = useAuth();
	const [form, setForm] = useState(defaults);

	useEffect(() => {
		if (!user?.uid) return;
		const saved = getSettings(user.uid);
		const nextForm = { ...defaults, ...saved };
		setForm(nextForm);
		applyTheme(nextForm.darkMode);
	}, [user?.uid]);

	const change = (event) => {
		const value = event.target.type === 'checkbox'
			? event.target.checked
			: event.target.value;

		setForm((current) => {
			const nextForm = { ...current, [event.target.name]: value };
			if (event.target.name === 'darkMode') {
				applyTheme(value);
				saveSettings(user.uid, nextForm);
			}
			return nextForm;
		});
	};

	const save = () => {
		saveSettings(user.uid, form);
		applyTheme(form.darkMode);
		toast.success('Settings saved.');
	};

	const reset = () => {
		const nextForm = resetSettings(user.uid);
		setForm(nextForm);
		applyTheme(nextForm.darkMode);
		toast.success('Settings reset.');
	};

	return (
		<ProtectedLayout title="Settings" subtitle="Control display, notification, and calculation preferences.">
			<div className="glass-card panel-card settings-panel">
				<div className="card-head">
					<div>
						<p className="eyebrow">Preferences</p>
						<h4>Workspace settings</h4>
					</div>
				</div>
				<div className="field-grid">
					{[
						['darkMode', 'Dark Mode'],
						['emailNotifications', 'Email Notifications'],
						['smsNotifications', 'SMS Notifications'],
						['autoReportGeneration', 'Auto Report Generation'],
					].map(([name, label]) => (
						<label className="toggle-row" key={name}>
							<span>{label}</span>
							<input type="checkbox" name={name} checked={form[name]} onChange={change} />
						</label>
					))}
					<label><span>Language</span><select name="language" value={form.language} onChange={change}><option>English</option><option>French</option></select></label>
					<label><span>Currency</span><select name="currency" value={form.currency} onChange={change}><option value="NGN">NGN (Naira)</option><option value="USD">USD ($)</option></select></label>
					<label><span>Default ROI Calculation</span><select name="defaultRoiCalculation" value={form.defaultRoiCalculation} onChange={change}><option>Simple ROI</option><option>Cash on Cash</option></select></label>
				</div>
				<div className="form-actions">
					<button className="btn btn-primary" onClick={save}>Save Settings</button>
					<button className="btn btn-secondary" onClick={reset}>Reset Settings</button>
				</div>
			</div>
		</ProtectedLayout>
	);
}
