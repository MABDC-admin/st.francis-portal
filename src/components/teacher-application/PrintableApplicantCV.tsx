import { format } from 'date-fns';
import { Mail, Phone, MapPin, Calendar, Award, Briefcase, GraduationCap, FileText, User } from 'lucide-react';

interface Props {
    application: any;
}

export const PrintableApplicantCV = ({ application: app }: Props) => {
    if (!app) return null;

    const DetailRow = ({ icon: Icon, label, value }: { icon: any, label: string, value?: string | null }) => {
        if (!value) return null;
        return (
            <div className="flex items-start gap-2 mb-2">
                <Icon className="w-4 h-4 mt-1 text-gray-500" />
                <div>
                    <span className="text-xs text-gray-500 block uppercase tracking-wide">{label}</span>
                    <span className="text-sm font-medium text-gray-900">{value}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="printable-cv-container hidden bg-white text-black p-8 max-w-[210mm] mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b-2 border-gray-100 pb-8 mb-8">
                <div className="flex items-center gap-6">
                    <div className="h-24 w-24 rounded-full bg-gray-100 border-2 border-gray-200 overflow-hidden flex items-center justify-center print:border-gray-300">
                        {app.photo_url ? (
                            <img src={app.photo_url} alt="Profile" className="h-full w-full object-cover" />
                        ) : (
                            <User className="h-12 w-12 text-gray-400" />
                        )}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            {app.first_name} {app.middle_name} {app.last_name} {app.suffix}
                        </h1>
                        <div className="flex flex-wrap gap-3">
                            <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-semibold text-gray-700 print:border print:border-gray-200">
                                {app.position_applied}
                            </span>
                            <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600 print:border print:border-gray-200">
                                ID: {app.reference_number}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="text-right text-sm text-gray-500">
                    <p>Generated on {format(new Date(), 'MMM d, yyyy')}</p>
                    <p>St. Francis Xavier Smart Academy</p>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* Left Sidebar */}
                <div className="col-span-4 border-r border-gray-100 pr-6">
                    <section className="mb-8">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-2 mb-4">
                            Contact & Info
                        </h3>
                        <DetailRow icon={Mail} label="Email" value={app.email} />
                        <DetailRow icon={Phone} label="Mobile" value={app.mobile_number} />
                        <DetailRow icon={MapPin} label="Address" value={`${app.house_street}, ${app.barangay}, ${app.city_municipality}`} />
                        <DetailRow icon={Calendar} label="Birth Date" value={format(new Date(app.date_of_birth), 'MMMM d, yyyy')} />
                        <DetailRow icon={User} label="Civil Status" value={app.civil_status} />
                    </section>

                    {app.has_prc_license && (
                        <section className="mb-8">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-2 mb-4">
                                License
                            </h3>
                            <DetailRow icon={Award} label="PRC Number" value={app.prc_license_number} />
                            <DetailRow icon={Calendar} label="Expiration" value={app.prc_expiration_date} />
                        </section>
                    )}

                    <section className="mb-8">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-2 mb-4">
                            Skills
                        </h3>
                        {app.subject_specialization?.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {app.subject_specialization.map((s: string) => (
                                    <span key={s} className="px-2 py-1 bg-gray-50 text-xs rounded border border-gray-200">{s}</span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">No specialization listed</p>
                        )}
                    </section>
                </div>

                {/* Main Content */}
                <div className="col-span-8">
                    {/* Experience */}
                    <section className="mb-10">
                        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 border-b-2 border-gray-100 pb-2 mb-6">
                            <Briefcase className="w-5 h-5 text-gray-700" /> Work Experience
                        </h3>
                        <div className="space-y-6">
                            {app.has_experience && (app.experience as any[])?.length > 0 ? (
                                (app.experience as any[]).map((exp, i) => (
                                    <div key={i} className="relative pl-6 border-l-2 border-gray-200 pb-1">
                                        <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-gray-400"></div>
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h4 className="text-base font-bold text-gray-900">{exp.position}</h4>
                                            <span className="text-sm text-gray-500 font-medium whitespace-nowrap">{exp.start_date} - {exp.end_date || 'Present'}</span>
                                        </div>
                                        <p className="text-sm text-gray-700 mb-1">{exp.school}</p>
                                        <p className="text-xs text-gray-500 italic">Subject: {exp.subjects}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 italic">No work experience listed.</p>
                            )}
                        </div>
                    </section>

                    {/* Education */}
                    <section className="mb-10">
                        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 border-b-2 border-gray-100 pb-2 mb-6">
                            <GraduationCap className="w-5 h-5 text-gray-700" /> Education
                        </h3>
                        <div className="space-y-4">
                            {(app.education as any[])?.map((edu, i) => (
                                <div key={i} className="bg-gray-50 p-4 rounded-lg border border-gray-100 print:bg-white print:border-gray-200">
                                    <div className="flex justify-between">
                                        <h4 className="font-bold text-gray-900">{edu.course}</h4>
                                        <span className="text-sm text-gray-600 font-medium">{edu.year_graduated}</span>
                                    </div>
                                    {edu.major && <p className="text-sm text-gray-700 mb-1">Major in {edu.major}</p>}
                                    <p className="text-sm text-gray-600">{edu.school}</p>
                                    {edu.honors && (
                                        <div className="mt-2 text-xs font-semibold text-gray-800 flex items-center gap-1">
                                            <Award className="w-3 h-3" /> {edu.honors}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Essays */}
                    <section>
                        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 border-b-2 border-gray-100 pb-2 mb-6">
                            <FileText className="w-5 h-5 text-gray-700" /> Additional Details
                        </h3>
                        {app.why_join && (
                            <div className="mb-4">
                                <h5 className="text-sm font-bold text-gray-700 mb-1">Why do you want to join us?</h5>
                                <p className="text-sm text-gray-600 leading-relaxed text-justify bg-gray-50 p-3 rounded print:bg-transparent print:p-0">"{app.why_join}"</p>
                            </div>
                        )}
                        {app.teaching_philosophy && (
                            <div>
                                <h5 className="text-sm font-bold text-gray-700 mb-1">Teaching Philosophy</h5>
                                <p className="text-sm text-gray-600 leading-relaxed text-justify bg-gray-50 p-3 rounded print:bg-transparent print:p-0">"{app.teaching_philosophy}"</p>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
};
