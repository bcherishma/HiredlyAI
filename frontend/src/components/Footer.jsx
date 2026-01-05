import React from 'react';
import { Stars } from 'lucide-react';

function Footer() {
    return (
        <footer className="py-12 border-t border-white/10 bg-gray-950 text-white">
            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="flex items-center gap-2 mb-4 md:mb-0">
                        <div className="w-6 h-6 rounded bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center">
                            <Stars className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-lg font-bold">Hiredly</span>
                    </div>

                    <div className="flex gap-8 text-sm text-gray-400">
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms</a>
                        <a href="#" className="hover:text-white transition-colors">Contact</a>
                    </div>

                    <div className="mt-4 md:mt-0 text-sm text-gray-600">
                        © 2025 Hiredly AI. All rights reserved.
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
