import React, { forwardRef } from 'react';
import Image from 'next/image';
import styles from './card.module.scss';

interface ServiceCardProps {
    title: string;
    numbering: string;
    listItems: string[]; // New prop for dynamic list items
}

const ServiceCard = forwardRef<HTMLDivElement, ServiceCardProps>(
    ({ title, numbering, listItems }, ref) => {
        return (
            <div className={styles.card} ref={ref}>
                <div className={styles.cardWrapper}>
                    <div className={styles.flipCardInner}>
                        <div className={`${styles.flipCardFront} flipCardFrontA`}>
                            <Image
                                src="/images/serviceCard.png"
                                width={500}
                                height={500}
                                alt='card'
                            />
                        </div>
                        {/* Card details */}
                        <div className={`${styles.flipCardBack} flipCardBackB`}>
                            <h3 className={styles.title}>{title}</h3>
                            <ul>
                                {listItems.map((item, index) => (
                                    <li key={index}>{item}</li>
                                ))}
                            </ul>
                            <h2 className={styles.numbering}>{numbering}</h2>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
);

ServiceCard.displayName = 'ServiceCard';
export default ServiceCard;